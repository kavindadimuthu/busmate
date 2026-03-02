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
            <div className="flex flex-col rounded-lg p-4 bg-white border border-slate-200 shadow-sm w-2/5">
                <span className="text-sm text-slate-500">No schedule selected</span>
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
        <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm w-2/5 overflow-hidden">
            {/* Section Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-700">
                    Exceptions <span className="font-normal text-slate-500">({exceptions.length})</span>
                </span>
                <button
                    onClick={handleAddNew}
                    disabled={isAddingNew}
                    className="px-2.5 py-1.5 bg-blue-700 text-white text-xs rounded-md hover:bg-blue-800 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    <Plus size={14} />
                    <span>Add</span>
                </button>
            </div>

            <div className="p-3">
                {/* Add new exception form */}
                {isAddingNew && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={editForm.exceptionDate}
                                    onChange={(e) => setEditForm({ ...editForm, exceptionDate: e.target.value })}
                                    className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                />
                                <select
                                    value={editForm.exceptionType}
                                    onChange={(e) => setEditForm({ ...editForm, exceptionType: e.target.value as ExceptionTypeEnum })}
                                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    <X size={14} />
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!editForm.exceptionDate}
                                    className="px-2.5 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                >
                                    <Check size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {exceptions.length === 0 && !isAddingNew && (
                        <div className="text-xs text-slate-500 text-center py-6 bg-slate-50 rounded-lg border border-slate-100">
                            No exceptions added yet
                        </div>
                    )}

                    {exceptions.map((exception, index) => (
                        <div key={exception.id || index}>
                            {editingIndex === index ? (
                                // Edit mode
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={editForm.exceptionDate}
                                                onChange={(e) => setEditForm({ ...editForm, exceptionDate: e.target.value })}
                                                className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            />
                                            <select
                                                value={editForm.exceptionType}
                                                onChange={(e) => setEditForm({ ...editForm, exceptionType: e.target.value as ExceptionTypeEnum })}
                                                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                                            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleCancel}
                                                className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={!editForm.exceptionDate}
                                                className="px-2.5 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // View mode
                                <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between hover:border-slate-300 transition-colors">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs font-medium text-slate-700 w-20 shrink-0">{exception.exceptionDate}</span>
                                        <span className={`px-1.5 py-0.5 text-xs rounded-md shrink-0 font-medium ${exception.exceptionType === 'REMOVED' ? 'bg-rose-100 text-rose-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {exception.exceptionType}
                                        </span>
                                        {exception.description && (
                                            <span className="text-xs text-slate-500 truncate" title={exception.description}>
                                                {exception.description}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEdit(index)}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-md transition-colors"
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
