import React, { useState, useEffect } from 'react';
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

  // New Memory Form
  const [newType, setNewType] = useState<'fact' | 'preference' | 'goal' | 'person' | 'milestone'>('fact');
  const [newContent, setNewContent] = useState('');
  const [newImportance] = useState(0.8);

  const loadData = async () => {
    try {
      const [mList, eList] = await Promise.all([
        api.getMemories(),
        api.getEvents()
      ]);
      setMemories(mList);
      setEvents(eList);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      const created = await api.createMemory({
        type: newType,
        content: newContent.trim(),
        importance: newImportance
      });
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
      const updated = await api.updateMemory(editingMemory.id, {
        content: editingMemory.content,
        importance: editingMemory.importance,
        type: editingMemory.type
      });
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
      setMemories(prev => prev.map(m => m.id === id ? null : m).filter(Boolean) as Memory[]);
    } catch (e) {
      alert('Failed to delete memory');
    }
  };

  const filteredMemories = activeFilter === 'all'
    ? memories
    : memories.filter(m => m.type === activeFilter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preference': return <Heart size={14} color="var(--accent-rose)" />;
      case 'goal': return <Target size={14} color="var(--accent-amber)" />;
      case 'person': return <UserIcon size={14} color="var(--accent-teal)" />;
      case 'milestone': return <Sparkles size={14} color="var(--accent-purple)" />;
      default: return <Tag size={14} color="var(--accent-indigo)" />;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Brain size={26} color="var(--accent-purple)" />
            Long-Term Memory & Events
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Transparently view, edit, or delete the meaningful facts and upcoming milestones Serenity remembers.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} /> Add Memory
        </button>
      </div>

      {/* Events / Deadlines Section */}
      {events.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--accent-indigo)" />
            Upcoming Extracted Events & Follow-ups
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {events.map(ev => (
              <div key={ev.id} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{ev.title}</h3>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(20, 184, 166, 0.15)',
                    color: 'var(--accent-teal)'
                  }}>
                    {ev.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <Clock size={14} />
                  <span>{new Date(ev.event_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {['all', 'preference', 'goal', 'person', 'fact', 'milestone'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            style={{
              background: activeFilter === filter ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              border: activeFilter === filter ? '1px solid var(--border-highlight)' : '1px solid var(--border-subtle)',
              color: activeFilter === filter ? '#ffffff' : 'var(--text-secondary)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {filter} ({filter === 'all' ? memories.length : memories.filter(m => m.type === filter).length})
          </button>
        ))}
      </div>

      {/* Memories Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Brain size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No memories found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
            As you chat with Serenity, it will automatically remember meaningful goals, preferences, and important people you mention.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredMemories.map(m => (
            <div key={m.id} className="glass-panel glass-panel-interactive" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {getTypeIcon(m.type)}
                    <span>{m.type}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Importance: {Math.round(m.importance * 100)}%
                  </span>
                </div>

                {editingMemory?.id === m.id ? (
                  <div>
                    <textarea
                      value={editingMemory.content}
                      onChange={(e) => setEditingMemory({ ...editingMemory, content: e.target.value })}
                      style={{ width: '100%', minHeight: '60px', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSaveEdit} className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setEditingMemory(null)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '14px' }}>
                    "{m.content}"
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Saved {new Date(m.created_at).toLocaleDateString()}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setEditingMemory(m)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    title="Edit Memory"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{ background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '4px' }}
                    title="Delete Memory"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '460px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Add a Memory Manually</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMemory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="fact">General Fact</option>
                  <option value="preference">Personal Preference</option>
                  <option value="goal">Goal / Ambition</option>
                  <option value="person">Important Person / Relationship</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Memory Description
                </label>
                <textarea
                  required
                  placeholder="e.g. Preparing for machine learning engineer interviews this month"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ width: '100%', minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  Save to Long-Term Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
