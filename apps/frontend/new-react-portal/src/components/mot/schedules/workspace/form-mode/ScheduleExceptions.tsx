'use client';

import { useState } from 'react';
import { Edit, Plus, Trash, X, Check } from "lucide-react";
import { useScheduleWorkspace } from '@/context/ScheduleWorkspace';
import { createEmptyException, ExceptionTypeEnum, ScheduleException } from '@/types/ScheduleWorkspaceData';

export default function ScheduleExceptions() {
    const { getActiveSchedule, addException, updateException, removeException, activeScheduleIndex } = useScheduleWorkspace();

    const activeSchedule = getActiveSchedule();
    const exceptions = activeSchedule?.exceptions || [];

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<ScheduleException>(createEmptyException());

    // Don't render if no active schedule
    if (!activeSchedule || activeScheduleIndex === null) {
        return (
            <div className="flex flex-col rounded-lg p-4 bg-card border border-border shadow-sm w-2/5">
                <span className="text-sm text-muted-foreground">No schedule selected</span>
            </div>
        );
    }

    const handleAddNew = () => {
        setIsAddingNew(true);
        setEditForm(createEmptyException());
        setEditingIndex(null);
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setEditForm({ ...exceptions[index] });
        setIsAddingNew(false);
    };

    const handleSave = () => {
        if (!editForm.exceptionDate) return;

        if (isAddingNew) {
            addException(editForm);
            setIsAddingNew(false);
        } else if (editingIndex !== null) {
            updateException(editingIndex, editForm);
            setEditingIndex(null);
        }
        setEditForm(createEmptyException());
    };

    const handleCancel = () => {
        setIsAddingNew(false);
        setEditingIndex(null);
        setEditForm(createEmptyException());
    };

    const handleDelete = (index: number) => {
        if (confirm('Are you sure you want to remove this exception?')) {
            removeException(index);
        }
    };

    return (
        <div className="flex flex-col rounded-lg bg-card border border-border shadow-sm w-2/5 overflow-hidden">
            {/* Section Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-muted border-b border-border">
                <span className="text-sm font-semibold text-muted-foreground">
                    Exceptions <span className="font-normal text-muted-foreground">({exceptions.length})</span>
                </span>
                <button
                    onClick={handleAddNew}
                    disabled={isAddingNew}
                    className="px-2.5 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    <Plus size={14} />
                    <span>Add</span>
                </button>
            </div>

            <div className="p-3">
                {/* Add new exception form */}
                {isAddingNew && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={editForm.exceptionDate}
                                    onChange={(e) => setEditForm({ ...editForm, exceptionDate: e.target.value })}
                                    className="flex-1 text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary bg-card"
                                />
                                <select
                                    value={editForm.exceptionType}
                                    onChange={(e) => setEditForm({ ...editForm, exceptionType: e.target.value as ExceptionTypeEnum })}
                                    className="text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary bg-card"
                                >
                                    <option value={ExceptionTypeEnum.REMOVED}>Removed</option>
                                    <option value={ExceptionTypeEnum.ADDED}>Added</option>
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Description (optional)"
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary bg-card"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    <X size={14} />
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!editForm.exceptionDate}
                                    className="px-2.5 py-1.5 text-xs bg-success text-white rounded-md hover:bg-success disabled:opacity-50 transition-colors"
                                >
                                    <Check size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {exceptions.length === 0 && !isAddingNew && (
                        <div className="text-xs text-muted-foreground text-center py-6 bg-muted rounded-lg border border-border/50">
                            No exceptions added yet
                        </div>
                    )}

                    {exceptions.map((exception, index) => (
                        <div key={exception.id || index}>
                            {editingIndex === index ? (
                                // Edit mode
                                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={editForm.exceptionDate}
                                                onChange={(e) => setEditForm({ ...editForm, exceptionDate: e.target.value })}
                                                className="flex-1 text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary bg-card"
                                            />
                                            <select
                                                value={editForm.exceptionType}
                                                onChange={(e) => setEditForm({ ...editForm, exceptionType: e.target.value as ExceptionTypeEnum })}
                                                className="text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary bg-card"
                                            >
                                                <option value={ExceptionTypeEnum.REMOVED}>Removed</option>
                                                <option value={ExceptionTypeEnum.ADDED}>Added</option>
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Description (optional)"
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary bg-card"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleCancel}
                                                className="px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={!editForm.exceptionDate}
                                                className="px-2.5 py-1.5 text-xs bg-success text-white rounded-md hover:bg-success disabled:opacity-50 transition-colors"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // View mode
                                <div className="bg-card border border-border rounded-lg p-2.5 flex items-center justify-between hover:border-border transition-colors">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">{exception.exceptionDate}</span>
                                        <span className={`px-1.5 py-0.5 text-xs rounded-md shrink-0 font-medium ${exception.exceptionType === 'REMOVED' ? 'bg-destructive/15 text-destructive' :
                                                'bg-success/15 text-success'
                                            }`}>
                                            {exception.exceptionType}
                                        </span>
                                        {exception.description && (
                                            <span className="text-xs text-muted-foreground truncate" title={exception.description}>
                                                {exception.description}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEdit(index)}
                                            className="text-primary hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
