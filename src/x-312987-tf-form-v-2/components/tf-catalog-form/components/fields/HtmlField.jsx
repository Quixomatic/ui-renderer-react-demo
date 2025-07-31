import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from '@tiptap/extension-font-size';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { 
    Bold, 
    Italic, 
    Underline as UnderlineIcon, 
    List, 
    ListOrdered,
    Link as LinkIcon,
    Undo,
    Redo,
    Type,
    Palette,
    Highlighter,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Table as TableIcon,
    Code,
    ChevronDown
} from 'lucide-react';
import { Button } from '../../../../../components/ui/button.jsx';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu.jsx';
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../../../../components/ui/dialog.jsx';
import { Textarea } from '../../../../../components/ui/textarea.jsx';
import { BaseField } from './BaseField.jsx';
import { cn } from '../../../../../../components/lib/utils.js';

/**
 * HtmlField - Rich text editor field using Tiptap
 * 
 * Handles html type fields with proper value/displayValue handling.
 * Uses Tiptap for WYSIWYG editing with a simple toolbar.
 */
export function HtmlField({ 
    baseFieldProps,
    onValueChange 
}) {
    // Extract needed values from baseFieldProps
    const { name, config, value, error, fieldState, shadowRoot } = baseFieldProps;
    
    // Get current field value
    const currentValue = typeof value === 'object' ? (value?.value || '') : (value || '');
    const displayValue = typeof value === 'object' ? (value?.displayValue || value?.value || '') : (value || '');
    
    // Check if field is readonly or disabled
    const isReadOnly = fieldState?.readonly || config.readOnly;
    const isDisabled = fieldState?.disabled;

    // State for HTML source view
    const [showSourceView, setShowSourceView] = useState(false);
    const [sourceHtml, setSourceHtml] = useState('');

    // Initialize Tiptap editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: config.exampleText || 'Enter rich text content...',
            }),
            TextStyle,
            Color,
            Highlight.configure({ 
                multicolor: true 
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            FontFamily.configure({
                types: ['textStyle'],
            }),
            FontSize.configure({
                types: ['textStyle'],
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: displayValue,
        editable: !isReadOnly && !isDisabled,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            
            // Only update if content actually changed
            if (html !== displayValue) {
                onValueChange(name, {
                    value: html,
                    displayValue: html
                });
            }
        },
    });

    // Update editor content when value changes externally
    React.useEffect(() => {
        if (editor && editor.getHTML() !== displayValue) {
            editor.commands.setContent(displayValue);
        }
    }, [displayValue, editor]);

    // Font families (system/browser fonts)
    const fontFamilies = [
        { name: 'Default', value: '' },
        { name: 'Arial', value: 'Arial, sans-serif' },
        { name: 'Georgia', value: 'Georgia, serif' },
        { name: 'Times New Roman', value: '"Times New Roman", serif' },
        { name: 'Helvetica', value: 'Helvetica, sans-serif' },
        { name: 'Courier New', value: '"Courier New", monospace' },
        { name: 'Verdana', value: 'Verdana, sans-serif' },
    ];

    // Font sizes
    const fontSizes = [
        { name: 'Small', value: '12px' },
        { name: 'Normal', value: '14px' },
        { name: 'Large', value: '18px' },
        { name: 'Extra Large', value: '24px' },
    ];

    // Color options
    const colors = [
        '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
        '#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#0066FF', '#9900FF',
        '#FF3366', '#FF9933', '#FFFF33', '#33FF33', '#3366FF', '#9933FF',
    ];

    // Handle source view
    const handleSourceView = () => {
        if (showSourceView) {
            // Apply changes from source view
            if (editor) {
                editor.commands.setContent(sourceHtml);
            }
            setShowSourceView(false);
        } else {
            // Show source view
            setSourceHtml(editor?.getHTML() || '');
            setShowSourceView(true);
        }
    };

    // Toolbar button component
    const ToolbarButton = ({ onClick, isActive, children, title, className }) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
                "h-8 w-8 p-0",
                isActive && "bg-accent",
                className
            )}
            title={title}
            disabled={isDisabled || isReadOnly}
        >
            {children}
        </Button>
    );

    // Dropdown toolbar button
    const ToolbarDropdown = ({ trigger, children, title }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    title={title}
                    disabled={isDisabled || isReadOnly}
                >
                    {trigger}
                    <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent container={shadowRoot}>{children}</DropdownMenuContent>
        </DropdownMenu>
    );

    if (!editor) {
        return (
            <BaseField {...baseFieldProps}>
                <div className="border rounded-md p-3 min-h-[120px] bg-muted/50">
                    Loading editor...
                </div>
            </BaseField>
        );
    }

    return (
        <BaseField {...baseFieldProps}>
            <div className={cn(
                "border border-border rounded-md overflow-hidden shadow-sm",
                error ? 'border-destructive' : '',
                isDisabled ? 'opacity-50' : ''
            )}>
                {/* Enhanced Toolbar */}
                {!isReadOnly && !isDisabled && (
                    <div className="border-b border-border p-2 flex items-center gap-1 bg-muted/20 flex-wrap">
                        {/* Font Family */}
                        <ToolbarDropdown 
                            trigger={<><Type className="h-4 w-4" /><span className="ml-1 text-xs">Font</span></>}
                            title="Font Family"
                        >
                            {fontFamilies.map((font) => (
                                <DropdownMenuItem
                                    key={font.value}
                                    onClick={() => {
                                        if (font.value) {
                                            editor.chain().focus().setFontFamily(font.value).run();
                                        } else {
                                            editor.chain().focus().unsetFontFamily().run();
                                        }
                                    }}
                                    className={font.value ? `font-[${font.value}]` : ''}
                                >
                                    {font.name}
                                </DropdownMenuItem>
                            ))}
                        </ToolbarDropdown>

                        {/* Font Size */}
                        <ToolbarDropdown 
                            trigger={<><Type className="h-4 w-4" /><span className="ml-1 text-xs">Size</span></>}
                            title="Font Size"
                        >
                            {fontSizes.map((size) => (
                                <DropdownMenuItem
                                    key={size.value}
                                    onClick={() => {
                                        // Use the FontSize extension
                                        editor.chain().focus().setFontSize(size.value).run();
                                    }}
                                >
                                    {size.name}
                                </DropdownMenuItem>
                            ))}
                        </ToolbarDropdown>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Basic Formatting */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                            title="Bold"
                        >
                            <Bold className="h-4 w-4" />
                        </ToolbarButton>
                        
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                            title="Italic"
                        >
                            <Italic className="h-4 w-4" />
                        </ToolbarButton>
                        
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            isActive={editor.isActive('underline')}
                            title="Underline"
                        >
                            <UnderlineIcon className="h-4 w-4" />
                        </ToolbarButton>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Text Color */}
                        <ToolbarDropdown 
                            trigger={<Palette className="h-4 w-4" />}
                            title="Text Color"
                        >
                            <div className="p-2">
                                <div className="grid grid-cols-6 gap-1">
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => editor.chain().focus().setColor(color).run()}
                                            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <DropdownMenuItem
                                    onClick={() => editor.chain().focus().unsetColor().run()}
                                    className="mt-2"
                                >
                                    Remove Color
                                </DropdownMenuItem>
                            </div>
                        </ToolbarDropdown>

                        {/* Highlight Color */}
                        <ToolbarDropdown 
                            trigger={<Highlighter className="h-4 w-4" />}
                            title="Highlight Color"
                        >
                            <div className="p-2">
                                <div className="grid grid-cols-6 gap-1">
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => editor.chain().focus().setHighlight({ color }).run()}
                                            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <DropdownMenuItem
                                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                                    className="mt-2"
                                >
                                    Remove Highlight
                                </DropdownMenuItem>
                            </div>
                        </ToolbarDropdown>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Text Alignment */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            isActive={editor.isActive({ textAlign: 'left' })}
                            title="Align Left"
                        >
                            <AlignLeft className="h-4 w-4" />
                        </ToolbarButton>
                        
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            isActive={editor.isActive({ textAlign: 'center' })}
                            title="Align Center"
                        >
                            <AlignCenter className="h-4 w-4" />
                        </ToolbarButton>
                        
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            isActive={editor.isActive({ textAlign: 'right' })}
                            title="Align Right"
                        >
                            <AlignRight className="h-4 w-4" />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                            isActive={editor.isActive({ textAlign: 'justify' })}
                            title="Justify"
                        >
                            <AlignJustify className="h-4 w-4" />
                        </ToolbarButton>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Lists */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                            title="Bullet List"
                        >
                            <List className="h-4 w-4" />
                        </ToolbarButton>
                        
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                            title="Numbered List"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </ToolbarButton>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Table */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            isActive={editor.isActive('table')}
                            title="Insert Table"
                        >
                            <TableIcon className="h-4 w-4" />
                        </ToolbarButton>

                        {/* Link */}
                        <ToolbarButton
                            onClick={() => {
                                const url = window.prompt('Enter URL:');
                                if (url) {
                                    editor.chain().focus().setLink({ href: url }).run();
                                }
                            }}
                            isActive={editor.isActive('link')}
                            title="Add Link"
                        >
                            <LinkIcon className="h-4 w-4" />
                        </ToolbarButton>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Source View */}
                        <ToolbarButton
                            onClick={handleSourceView}
                            isActive={showSourceView}
                            title="HTML Source"
                        >
                            <Code className="h-4 w-4" />
                        </ToolbarButton>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Undo/Redo */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().undo().run()}
                            isActive={false}
                            title="Undo"
                        >
                            <Undo className="h-4 w-4" />
                        </ToolbarButton>
                        
                        <ToolbarButton
                            onClick={() => editor.chain().focus().redo().run()}
                            isActive={false}
                            title="Redo"
                        >
                            <Redo className="h-4 w-4" />
                        </ToolbarButton>
                    </div>
                )}

                {/* Editor Content or Source View */}
                {showSourceView ? (
                    <div className="p-3">
                        <Textarea
                            value={sourceHtml}
                            onChange={(e) => setSourceHtml(e.target.value)}
                            className="font-mono text-sm min-h-[120px] resize-none"
                            placeholder="HTML source code..."
                        />
                        <div className="mt-2 flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSourceView}
                            >
                                Apply Changes
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowSourceView(false);
                                    setSourceHtml('');
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <EditorContent 
                        editor={editor}
                        className={cn(
                            "prose prose-sm max-w-none p-3 min-h-[120px] focus-within:outline-none",
                            "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[96px]",
                            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
                            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
                            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
                            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
                            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
                            // Table styling
                            "[&_.ProseMirror_table]:border-collapse-collapse [&_.ProseMirror_table]:table-auto [&_.ProseMirror_table]:w-full",
                            "[&_.ProseMirror_table_td]:border [&_.ProseMirror_table_td]:border-gray-300 [&_.ProseMirror_table_td]:p-2",
                            "[&_.ProseMirror_table_th]:border [&_.ProseMirror_table_th]:border-gray-300 [&_.ProseMirror_table_th]:p-2 [&_.ProseMirror_table_th]:bg-gray-100 [&_.ProseMirror_table_th]:font-bold"
                        )}
                    />
                )}
            </div>
        </BaseField>
    );
}