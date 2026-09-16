"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  ExternalLink,
  Loader2,
  FileText,
  File,
  Sparkles,
  Cloud,
  Copy,
  Check,
  Eye,
  ZoomIn,
  Plus,
} from "lucide-react";

export interface TaskAttachment {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  createdAt?: string | Date;
}

interface TaskImageUploaderProps {
  attachments: TaskAttachment[];
  onChange: (attachments: TaskAttachment[]) => void;
  onInsertMarkdown?: (markdownSnippet: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
  compact?: boolean;
}

export function TaskImageUploader({
  attachments = [],
  onChange,
  onInsertMarkdown,
  disabled = false,
  maxFiles = 10,
  className = "",
  compact = false,
}: TaskImageUploaderProps) {
  const { authFetch } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<TaskAttachment | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageMime = (mime?: string, url?: string) => {
    if (mime && mime.startsWith("image/")) return true;
    if (url && /\.(jpe?g|png|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url)) return true;
    return false;
  };

  const isCloudinaryUrl = (url?: string) => {
    return Boolean(url && url.includes("cloudinary.com"));
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (disabled || isUploading) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (attachments.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} attachments allowed per task.`);
      return;
    }

    setIsUploading(true);
    const newAttachments: TaskAttachment[] = [...attachments];

    try {
      for (const file of fileArray) {
        // Enforce 25MB max size per file
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds 25MB limit.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "task-attachments");
        formData.append("resourceType", file.type.startsWith("image/") ? "image" : "auto");

        const res = await authFetch("/api/v1/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (!json.success || !json.data?.url) {
          throw new Error(json.error?.message || `Failed to upload ${file.name}`);
        }

        newAttachments.push({
          name: json.data.name || file.name,
          url: json.data.url,
          size: json.data.size || file.size,
          mimeType: json.data.type || file.type || "application/octet-stream",
          createdAt: new Date().toISOString(),
        });

        toast.success(`Uploaded "${file.name}"`);
      }

      onChange(newAttachments);
    } catch (err: any) {
      console.error("[TaskImageUploader Error]:", err);
      toast.error(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = attachments.filter((_, i) => i !== index);
    onChange(updated);
    toast.info("Attachment removed from task");
  };

  const handleCopyLink = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("Image URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || !e.dataTransfer.files) return;
    handleUploadFiles(e.dataTransfer.files);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.zip,.txt,.csv"
        disabled={disabled || isUploading}
        className="hidden"
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
      />

      {/* Upload Dropzone */}
      <div
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl transition-all cursor-pointer text-center select-none ${
          compact ? "p-3" : "p-5"
        } ${
          isDragging
            ? "border-primary bg-primary/10 scale-[0.99]"
            : "border-border/70 hover:border-primary/50 hover:bg-muted/30 bg-muted/10"
        } ${disabled || isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex flex-col items-center justify-center gap-1.5">
          {isUploading ? (
            <div className="flex items-center gap-2 text-primary text-xs font-semibold py-1">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Uploading media...</span>
            </div>
          ) : (
            <>
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground flex items-center justify-center gap-1.5">
                  <span>Click to upload image or drag & drop</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  PNG, JPG, WEBP, GIF, PDF or docs up to 25MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Attachments & Image Gallery Grid */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Uploaded Images & Attachments ({attachments.length})</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10"
            >
              + Add More
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {attachments.map((att, idx) => {
              const isImg = isImageMime(att.mimeType, att.url);

              return (
                <div
                  key={att.url || idx}
                  className="group relative rounded-xl border bg-card overflow-hidden shadow-2xs hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  {/* Thumbnail / File Icon Area */}
                  {isImg ? (
                    <div
                      onClick={() => setPreviewImage(att)}
                      className="relative h-24 w-full bg-muted/40 cursor-pointer overflow-hidden flex items-center justify-center group-hover:opacity-95 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={att.url}
                        alt={att.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <span className="p-1.5 rounded-full bg-background/90 text-foreground hover:bg-background transition-colors">
                          <ZoomIn className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 w-full bg-muted/30 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground opacity-60" />
                    </div>
                  )}

                  {/* Footer Meta & Actions */}
                  <div className="p-2 space-y-1.5 bg-card">
                    <p className="text-[11px] font-semibold text-foreground truncate" title={att.name}>
                      {att.name}
                    </p>

                    {onInsertMarkdown && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const snippet = isImg
                            ? `![${att.name}](${att.url})`
                            : `[📎 ${att.name}](${att.url})`;
                          onInsertMarkdown(snippet);
                          toast.success("Inserted into description!");
                        }}
                        className="w-full h-6 text-[10px] px-1.5 gap-1 font-medium bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        <span>Insert in Text</span>
                      </Button>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span>{formatFileSize(att.size) || "File"}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(att.url, e)}
                          title="Copy Link"
                          className="hover:text-primary transition-colors p-0.5"
                        >
                          {copiedUrl === att.url ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in new tab"
                          className="hover:text-primary transition-colors p-0.5"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={(e) => handleRemove(idx, e)}
                            title="Delete"
                            className="hover:text-destructive transition-colors p-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Size Image Preview Lightbox Modal */}
      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-sm font-bold flex items-center justify-between">
              <span className="truncate pr-4">{previewImage?.name}</span>
              <div className="flex items-center gap-2">
                {previewImage?.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(previewImage.url, "_blank");
                    }}
                    className="h-7 text-xs gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Full Original
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto bg-black/5 dark:bg-black/40">
            {previewImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
