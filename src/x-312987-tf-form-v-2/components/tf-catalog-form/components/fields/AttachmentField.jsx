import React, { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { Button } from '../../../../../components/ui/button.jsx';
import { BaseField } from './BaseField.jsx';
import { cn } from '../../../../../../components/lib/utils.js';

/**
 * AttachmentField - File upload/download field
 * 
 * Handles file_attachment type fields with upload, download, and delete capabilities.
 * Uses enriched properties for file size limits, allowed extensions, and upload context.
 */
export function AttachmentField({ 
    baseFieldProps,
    onValueChange,
    onAttachmentUpload,
    onAttachmentDelete
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, fieldState, error } = baseFieldProps;
    
    // Extract enriched properties with fallbacks
    const {
        maxAttachmentSize = '5242880', // 5MB default
        allowedExtensions = '',
        tableName = '',
        tableSysId = '',
        enableVirusScan = true,
        contentType = '*/*'
    } = config;
    
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadError, setUploadError] = useState('');
    
    // Get current attachment (ServiceNow stores single attachment as sys_id)
    const attachmentSysId = typeof value === 'object' ? (value?.value || '') : (value || '');
    const attachmentName = typeof value === 'object' ? (value?.displayValue || '') : '';
    
    // Check if field is readonly or disabled
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;
    
    // Convert size limit to number
    const maxSizeBytes = parseInt(maxAttachmentSize);
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    
    // Parse allowed extensions
    const allowedExtArray = allowedExtensions ? allowedExtensions.split(',').map(ext => ext.trim()) : [];
    
    // Validate file before upload
    const validateFile = (file) => {
        // Check file size
        if (file.size > maxSizeBytes) {
            return `File size exceeds ${maxSizeMB}MB limit`;
        }
        
        // Check file extension if restrictions exist
        if (allowedExtArray.length > 0) {
            const fileExt = file.name.split('.').pop().toLowerCase();
            if (!allowedExtArray.includes(fileExt)) {
                return `File type .${fileExt} not allowed. Allowed types: ${allowedExtensions}`;
            }
        }
        
        return null; // No errors
    };
    
    // Handle file selection
    const handleFileSelect = (files) => {
        if (!files || files.length === 0) return;
        
        const file = files[0];
        const validationError = validateFile(file);
        
        if (validationError) {
            setUploadError(validationError);
            return;
        }
        
        setUploadError('');
        
        // Trigger upload through parent component
        if (onAttachmentUpload) {
            onAttachmentUpload(name, file, {
                tableName,
                tableSysId,
                enableVirusScan
            });
        }
    };
    
    // Handle drag and drop
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files);
        }
    };
    
    // Handle file input change
    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files);
        }
    };
    
    // Handle attachment deletion
    const handleDelete = () => {
        if (onAttachmentDelete) {
            onAttachmentDelete(name, attachmentSysId);
        }
        // Clear the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setUploadError('');
    };

    return (
        <BaseField {...baseFieldProps}>
            <div className="space-y-2">
                {/* Upload area */}
                {!attachmentSysId && !isReadOnly && !isDisabled && (
                    <div
                        className={cn(
                            "relative border rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
                            "hover:bg-accent hover:text-accent-foreground bg-background border-border shadow-sm",
                            dragActive ? "border-primary bg-primary/5" : "",
                            error || uploadError ? "border-destructive" : ""
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileInputChange}
                            accept={contentType}
                            disabled={isDisabled || isReadOnly}
                        />
                        
                        <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                Click or drag file to upload
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                                Max {maxSizeMB}MB
                            </span>
                        </div>
                    </div>
                )}
                
                {/* Current attachment display */}
                {attachmentSysId && (
                    <div className="flex items-center justify-between px-3 py-2 border rounded-md bg-background border-border shadow-sm">
                        <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate">
                                {attachmentName || 'Attachment'}
                            </span>
                        </div>
                        {!isReadOnly && !isDisabled && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1 -mr-1"
                                onClick={handleDelete}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                )}
                
                {/* Upload error message */}
                {uploadError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {uploadError}
                    </div>
                )}
                
                {/* Empty state for readonly */}
                {!attachmentSysId && (isReadOnly || isDisabled) && (
                    <div className="px-3 py-2 border rounded-md text-sm text-muted-foreground">
                        No attachment
                    </div>
                )}
            </div>
        </BaseField>
    );
}