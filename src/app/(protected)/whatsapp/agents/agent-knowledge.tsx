"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Trash2,
  Plus,
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

type DocumentStatus = "pending" | "processing" | "ready" | "error";

type WaKnowledgeDocument = {
  id: string;
  title: string;
  file_name: string;
  chunk_count?: number;
  status: DocumentStatus;
};

type WaKnowledgeFaq = {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
};

interface Props {
  agentId: string;
  organizationId: string;
}

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  if (status === "ready")
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="h-3 w-3" /> Pronto
      </span>
    );
  if (status === "processing")
    return (
      <span className="flex items-center gap-1 text-xs text-yellow-600">
        <Clock className="h-3 w-3" /> Processando...
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3 w-3" /> Erro
    </span>
  );
}

export function AgentKnowledge({ agentId, organizationId: _organizationId }: Props) {
  const [documents, setDocuments] = useState<WaKnowledgeDocument[]>([]);
  const [faqs, setFaqs] = useState<WaKnowledgeFaq[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "faqs">("documents");
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [addingFaq, setAddingFaq] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    const res = await fetch(`/api/whatsapp/knowledge/documents?agent_id=${agentId}`);
    if (res.ok) {
      const data = (await res.json()) as { documents: WaKnowledgeDocument[] };
      setDocuments(data.documents);
    }
  };

  const fetchFaqs = async () => {
    const res = await fetch(`/api/whatsapp/knowledge/faqs?agent_id=${agentId}`);
    if (res.ok) {
      const data = (await res.json()) as { faqs: WaKnowledgeFaq[] };
      setFaqs(data.faqs);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
    formData.append("agent_id", agentId);
    try {
      const res = await fetch("/api/whatsapp/knowledge/documents", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload falhou");
      await fetchDocuments();
    } catch {
      alert("Erro ao fazer upload do documento.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Excluir este documento?")) return;
    await fetch(`/api/whatsapp/knowledge/documents/${docId}`, { method: "DELETE" });
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    const res = await fetch("/api/whatsapp/knowledge/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId, ...newFaq }),
    });
    if (res.ok) {
      setNewFaq({ question: "", answer: "" });
      setAddingFaq(false);
      fetchFaqs();
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    await fetch(`/api/whatsapp/knowledge/faqs/${faqId}`, { method: "DELETE" });
    setFaqs((prev) => prev.filter((f) => f.id !== faqId));
  };

  const handleToggleFaq = async (faqId: string, isActive: boolean) => {
    await fetch(`/api/whatsapp/knowledge/faqs/${faqId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    fetchFaqs();
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all ${
            activeTab === "documents"
              ? "bg-purple-50 font-medium text-purple-700"
              : "text-gray-500 hover:bg-muted"
          }`}
        >
          <FileText className="h-4 w-4" />
          Documentos ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab("faqs")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all ${
            activeTab === "faqs"
              ? "bg-purple-50 font-medium text-purple-700"
              : "text-gray-500 hover:bg-muted"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          FAQs ({faqs.length})
        </button>
      </div>

      {activeTab === "documents" && (
        <div>
          <div className="mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.docx,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-gray-500 transition-all hover:border-purple-400 hover:text-purple-600 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading
                ? "Enviando..."
                : "Enviar documento (PDF, TXT, MD, DOCX, CSV — máx 50MB)"}
            </button>
          </div>

          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nenhum documento. Envie documentos para que o agente use como referência.
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{doc.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{doc.file_name}</span>
                      {doc.chunk_count != null && <span>{doc.chunk_count} chunks</span>}
                      <DocStatusBadge status={doc.status} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="rounded p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "faqs" && (
        <div>
          <button
            onClick={() => setAddingFaq(true)}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600"
          >
            <Plus className="h-4 w-4" />
            Adicionar FAQ
          </button>

          {addingFaq && (
            <div className="mb-3 rounded-lg border bg-gray-50 p-3">
              <input
                placeholder="Pergunta"
                value={newFaq.question}
                onChange={(e) => setNewFaq((p) => ({ ...p, question: e.target.value }))}
                className="mb-2 w-full rounded border bg-white px-3 py-1.5 text-sm"
              />
              <textarea
                placeholder="Resposta"
                value={newFaq.answer}
                onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))}
                rows={3}
                className="mb-2 w-full rounded border bg-white px-3 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddFaq}
                  className="rounded px-3 py-1.5 text-xs text-white"
                  style={{ backgroundColor: "#2d1f4e" }}
                >
                  Salvar
                </button>
                <button
                  onClick={() => setAddingFaq(false)}
                  className="rounded border px-3 py-1.5 text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {faqs.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nenhuma FAQ. Adicione perguntas frequentes para respostas padronizadas.
            </p>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`rounded-lg border px-3 py-2 ${!faq.is_active ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{faq.question}</p>
                      <p className="mt-1 text-xs text-gray-500">{faq.answer}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleFaq(faq.id, faq.is_active)}
                        className={`rounded px-2 py-1 text-xs ${
                          faq.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {faq.is_active ? "Ativa" : "Inativa"}
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="rounded p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
