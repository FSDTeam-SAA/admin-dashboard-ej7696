"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { supportAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search, Send } from "lucide-react";

type SupportTicket = {
  _id: string;
  userId: string;
  email: string;
  phone?: string;
  subject: string;
  description: string;
  status: "open" | "pending" | "closed";
  lastMessageAt?: string;
  createdAt?: string;
};

type SupportMessage = {
  _id: string;
  ticketId: string;
  senderRole?: "user" | "admin" | "sub-admin";
  senderId?: {
    name?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  message: string;
  createdAt?: string;
  attachment?: {
    url?: string;
  };
};

const formatDate = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString();
};

const buildSenderName = (message: SupportMessage) => {
  const sender = message.senderId;
  const nameParts = [sender?.firstName, sender?.lastName].filter(Boolean);
  const name =
    sender?.name ||
    (nameParts.length ? nameParts.join(" ") : "") ||
    sender?.email ||
    (message.senderRole === "user" ? "User" : "Admin");
  return name;
};

const statusBadgeClass = (status?: string) => {
  switch (status) {
    case "open":
      return "bg-green-100 text-green-700 border-green-200";
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "closed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
  } = useQuery(
    ["support-tickets", currentPage, statusFilter, searchTerm],
    () =>
      supportAPI.listTickets(currentPage, 20, {
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm || undefined,
      }),
    {
      keepPreviousData: true,
      onError: (error: any) => {
        console.error("[Support] Tickets error:", error);
        toast.error("Failed to load support tickets");
      },
    }
  );

  const ticketsPayload = ticketsData?.data?.data;
  const tickets: SupportTicket[] = ticketsPayload?.items || [];
  const totalTickets = ticketsPayload?.total || 0;
  const pageSize = ticketsPayload?.limit || 20;

  useEffect(() => {
    if (!tickets.length) {
      setSelectedTicketId(null);
      return;
    }
    if (!selectedTicketId || !tickets.some((t) => t._id === selectedTicketId)) {
      setSelectedTicketId(tickets[0]._id);
    }
  }, [tickets, selectedTicketId]);

  const {
    data: detailsData,
    isLoading: isDetailsLoading,
  } = useQuery(
    ["support-ticket-details", selectedTicketId],
    () => supportAPI.getTicketDetails(selectedTicketId as string),
    {
      enabled: Boolean(selectedTicketId),
      onError: (error: any) => {
        console.error("[Support] Ticket details error:", error);
        toast.error("Failed to load ticket details");
      },
    }
  );

  const detailsPayload = detailsData?.data?.data;
  const activeTicket: SupportTicket | undefined = detailsPayload?.ticket;
  const messages: SupportMessage[] = detailsPayload?.messages || [];

  const replyMutation = useMutation(
    async () => {
      if (!selectedTicketId) return;
      const trimmed = replyMessage.trim();
      if (!trimmed) {
        throw new Error("Message is required");
      }
      const formData = new FormData();
      formData.append("message", trimmed);
      return supportAPI.replyToTicket(selectedTicketId, formData);
    },
    {
      onSuccess: () => {
        toast.success("Reply sent");
        setReplyMessage("");
        queryClient.invalidateQueries(["support-ticket-details", selectedTicketId]);
        queryClient.invalidateQueries(["support-tickets"]);
      },
      onError: (error: any) => {
        console.error("[Support] Reply error:", error);
        toast.error(error?.response?.data?.message || "Failed to send reply");
      },
    }
  );

  const ticketCountLabel = useMemo(() => {
    if (!totalTickets) return "No tickets";
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalTickets);
    return `Showing ${start}-${end} of ${totalTickets}`;
  }, [currentPage, pageSize, totalTickets]);

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Support Tickets
        </h1>
        <p className="text-gray-500 mt-1">
          Review customer inquiries and respond quickly.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by subject, email, or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <Card className="overflow-hidden">
          <div className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
            Tickets
          </div>
          <ScrollArea className="h-[560px]">
            {isTicketsLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2 rounded-lg border p-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No support tickets found.
              </div>
            ) : (
              <div className="divide-y">
                {tickets.map((ticket) => {
                  const isActive = ticket._id === selectedTicketId;
                  return (
                    <button
                      key={ticket._id}
                      type="button"
                      onClick={() => setSelectedTicketId(ticket._id)}
                      className={`w-full text-left px-4 py-4 transition ${
                        isActive ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {ticket.subject}
                        </h3>
                        <Badge
                          variant="outline"
                          className={statusBadgeClass(ticket.status)}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {ticket.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Updated {formatDate(ticket.lastMessageAt || ticket.createdAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <div className="border-t px-4 py-3 text-xs text-gray-500">
            {ticketCountLabel}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="border-b px-6 py-4">
            {isDetailsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : activeTicket ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeTicket.subject}
                  </h2>
                  <Badge
                    variant="outline"
                    className={statusBadgeClass(activeTicket.status)}
                  >
                    {activeTicket.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {activeTicket.email}
                  {activeTicket.phone ? ` • ${activeTicket.phone}` : ""}
                </div>
                <div className="text-xs text-gray-400">
                  Created {formatDate(activeTicket.createdAt)}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a ticket to view details.</p>
            )}
          </div>

          <ScrollArea className="flex-1 px-6 py-4">
            {isDetailsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No messages yet.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isAdmin = message.senderRole !== "user";
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl border px-4 py-3 text-sm ${
                          isAdmin
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs opacity-80 mb-2">
                          <span>{buildSenderName(message)}</span>
                          <span>{formatDate(message.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        {message.attachment?.url ? (
                          <a
                            href={message.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-3 block text-xs underline ${
                              isAdmin ? "text-white" : "text-blue-600"
                            }`}
                          >
                            View attachment
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedTicketId) return;
              replyMutation.mutate();
            }}
            className="border-t px-6 py-4 space-y-3"
          >
            <Textarea
              placeholder="Type your reply..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              disabled={!selectedTicketId || replyMutation.isLoading}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!selectedTicketId || replyMutation.isLoading}
                className="gap-2"
              >
                {replyMutation.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {!isTicketsLoading && totalTickets > pageSize && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{ticketCountLabel}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                {"<"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage * pageSize >= totalTickets}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                {">"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
