import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import type { Memory, AppEvent } from '../types';
import {
  Brain,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  Tag,
  Target,
  Heart,
  User as UserIcon,
  Clock
} from 'lucide-react';

export const MemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const [newType, setNewType] = useState<'fact' | 'preference' | 'goal' | 'person' | 'milestone'>('fact');
  const [newContent, setNewContent] = useState('');
  const [newImportance] = useState(0.8);

  const loadData = async () => {
    try {
      const [mList, eList] = await Promise.all([api.getMemories(), api.getEvents()]);
      setMemories(mList);
      setEvents(eList);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      const created = await api.createMemory({ type: newType, content: newContent.trim(), importance: newImportance });
      setMemories(prev => [created, ...prev]);
      setNewContent('');
      setShowAddModal(false);
    } catch (e) {
      alert('Failed to add memory');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMemory) return;
    try {
      const updated = await api.updateMemory(editingMemory.id, { content: editingMemory.content, importance: editingMemory.importance, type: editingMemory.type });
      setMemories(prev => prev.map(m => m.id === updated.id ? updated : m));
      setEditingMemory(null);
    } catch (e) {
      alert('Failed to update memory');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want Serenity to forget this memory?')) return;
    try {
      await api.deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      alert('Failed to delete memory');
    }
  };

  const filteredMemories = activeFilter === 'all' ? memories : memories.filter(m => m.type === activeFilter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preference': return <Heart size={13} color="var(--accent-rose)" />;
      case 'goal': return <Target size={13} color="var(--accent-amber)" />;
      case 'person': return <UserIcon size={13} color="var(--accent)" />;
      case 'milestone': return <Sparkles size={13} color="var(--accent-purple)" />;
      default: return <Tag size={13} color="var(--accent)" />;
    }
  };

  const filters = ['all', 'preference', 'goal', 'person', 'fact', 'milestone'];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">
            <Brain size={24} color="var(--accent-purple)" />
            Memory & Events
          </h1>
          <p className="page-subtitle">View, edit, or delete the meaningful context Serenity remembers.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Memory
        </button>
      </div>

      {/* Events */}
      {events.length > 0 && (
        <motion.div
          className="card card-p"
          style={{ marginBottom: 24 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="var(--accent)" />
            Upcoming Events & Follow-ups
          </h2>
          <div className="events-grid">
            {events.map(ev => (
              <div key={ev.id} className="event-card">
                <div className="flex-between">
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>{ev.title}</h3>
                  <span className="event-status">{ev.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                  <Clock size={13} />
                  <span>{new Date(ev.event_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filter Pills */}
      <div className="filter-pills">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
          >
            {filter} ({filter === 'all' ? memories.length : memories.filter(m => m.type === filter).length})
          </button>
        ))}
      </div>

      {/* Memory Grid */}
      {filteredMemories.length === 0 ? (
        <div className="card empty-state">
          <Brain size={36} className="empty-icon" />
          <h3 className="empty-title">No memories found</h3>
          <p className="empty-text">
            As you chat with Serenity, it will automatically remember meaningful goals, preferences, and important people you mention.
          </p>
        </div>
      ) : (
        <div className="memory-grid">
          {filteredMemories.map((m, i) => (
            <motion.div
              key={m.id}
              className="card card-p card-interactive memory-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <div className="memory-type-badge">
                    {getTypeIcon(m.type)}
                    <span>{m.type}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {Math.round(m.importance * 100)}%
                  </span>
                </div>

                {editingMemory?.id === m.id ? (
                  <div>
                    <textarea
                      value={editingMemory.content}
                      onChange={(e) => setEditingMemory({ ...editingMemory, content: e.target.value })}
                      className="input-field"
                      style={{ marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleSaveEdit} className="btn btn-primary btn-sm">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setEditingMemory(null)} className="btn btn-secondary btn-sm">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="memory-content">"{m.content}"</p>
                )}
              </div>

              <div className="memory-footer">
                <span>Saved {new Date(m.created_at).toLocaleDateString()}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setEditingMemory(m)} className="btn-ghost" title="Edit">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="btn-ghost" style={{ color: 'var(--accent-rose)' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="modal-header">
                <h3 className="modal-title">Add Memory</h3>
                <button onClick={() => setShowAddModal(false)} className="modal-close">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddMemory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select value={newType} onChange={(e: any) => setNewType(e.target.value)} className="input-field">
                    <option value="fact">General Fact</option>
                    <option value="preference">Preference</option>
                    <option value="goal">Goal</option>
                    <option value="person">Important Person</option>
                    <option value="milestone">Milestone</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea
                    required
                    placeholder="e.g. Preparing for machine learning interviews this month"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                    Save Memory
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
