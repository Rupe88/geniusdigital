'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiRefresh } from 'react-icons/hi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import {
  getAdminLimitingBeliefCatalog,
  createLimitingBeliefSection,
  updateLimitingBeliefSection,
  deleteLimitingBeliefSection,
  createLimitingBeliefQuestion,
  updateLimitingBeliefQuestion,
  deleteLimitingBeliefQuestion,
  createLimitingBeliefScoreBand,
  updateLimitingBeliefScoreBand,
  deleteLimitingBeliefScoreBand,
  getAdminLimitingBeliefAttempts,
  type AdminLimitingBeliefCatalog,
  type AdminLimitingBeliefScoreBand,
  type LimitingBeliefAttemptRow,
} from '@/lib/api/limitingBelief';
import { handleApiError } from '@/lib/api/axios';

type Tab = 'content' | 'bands' | 'attempts';

export default function AdminStrongLimitingBeliefPage() {
  const [tab, setTab] = useState<Tab>('content');
  const [catalog, setCatalog] = useState<AdminLimitingBeliefCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<LimitingBeliefAttemptRow[]>([]);
  const [attemptsTotal, setAttemptsTotal] = useState(0);

  const [sectionModal, setSectionModal] = useState<'add' | 'edit' | null>(null);
  const [sectionEditId, setSectionEditId] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionOrder, setSectionOrder] = useState(0);

  const [questionModal, setQuestionModal] = useState<'add' | 'edit' | null>(null);
  const [questionSectionId, setQuestionSectionId] = useState<string | null>(null);
  const [questionEditId, setQuestionEditId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionOrder, setQuestionOrder] = useState(0);

  const [bandModal, setBandModal] = useState<'add' | 'edit' | null>(null);
  const [bandEdit, setBandEdit] = useState<AdminLimitingBeliefScoreBand | null>(null);
  const [bandMin, setBandMin] = useState(0);
  const [bandMax, setBandMax] = useState(0);
  const [bandLabel, setBandLabel] = useState('');
  const [bandDesc, setBandDesc] = useState('');
  const [bandOrder, setBandOrder] = useState(0);

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminLimitingBeliefCatalog();
      setCatalog(data);
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttempts = useCallback(async () => {
    try {
      const data = await getAdminLimitingBeliefAttempts({ limit: 50 });
      setAttempts(data.attempts);
      setAttemptsTotal(data.total);
    } catch (e) {
      toast.error(handleApiError(e));
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (tab === 'attempts') loadAttempts();
  }, [tab, loadAttempts]);

  const openAddSection = () => {
    setSectionTitle('');
    setSectionOrder(catalog?.sections.length ?? 0);
    setSectionEditId(null);
    setSectionModal('add');
  };

  const openEditSection = (id: string, title: string, order: number) => {
    setSectionEditId(id);
    setSectionTitle(title);
    setSectionOrder(order);
    setSectionModal('edit');
  };

  const saveSection = async () => {
    try {
      if (sectionModal === 'add') {
        await createLimitingBeliefSection({ title: sectionTitle, sortOrder: sectionOrder });
        toast.success('Section created');
      } else if (sectionModal === 'edit' && sectionEditId) {
        await updateLimitingBeliefSection(sectionEditId, { title: sectionTitle, sortOrder: sectionOrder });
        toast.success('Section updated');
      }
      setSectionModal(null);
      loadCatalog();
    } catch (e) {
      toast.error(handleApiError(e));
    }
  };

  const removeSection = async (id: string, title: string) => {
    if (!confirm(`Delete section "${title}" and all its questions?`)) return;
    try {
      await deleteLimitingBeliefSection(id);
      toast.success('Section deleted');
      loadCatalog();
    } catch (e) {
      toast.error(handleApiError(e));
    }
  };

  const toggleSectionActive = async (id: string, isActive: boolean) => {
    try {
      await updateLimitingBeliefSection(id, { isActive: !isActive });
      loadCatalog();
    } catch (e) {
      toast.error(handleApiError(e));
    }
  };

  const openAddQuestion = (sectionId: string) => {
    setQuestionSectionId(sectionId);
    setQuestionEditId(null);
    setQuestionText('');
    const sec = catalog?.sections.find((s) => s.id === sectionId);
    setQuestionOrder(sec?.questions.length ?? 0);
    setQuestionModal('add');
  };

  const openEditQuestion = (q: { id: string; text: string; sortOrder: number; sectionId: string }) => {
    setQuestionSectionId(q.sectionId);
    setQuestionEditId(q.id);
    setQuestionText(q.text);
    setQuestionOrder(q.sortOrder);
    setQuestionModal('edit');
  };

  const saveQuestion = async () => {
    if (!questionSectionId) return;
    try {
      if (questionModal === 'add') {
        await createLimitingBeliefQuestion({
          sectionId: questionSectionId,
          text: questionText,
          sortOrder: questionOrder,
        });
        toast.success('Question added');
      } else if (questionModal === 'edit' && questionEditId) {
        await updateLimitingBeliefQuestion(questionEditId, {
          text: questionText,
          sortOrder: questionOrder,
        });
        toast.success('Question updated');
      }
      setQuestionModal(null);
      loadCatalog();
    } catch (e) {
      toast.error(handleApiError(e));
    }
  };

  const removeQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteLimitingBeliefQuestion(id);
      toast.success('Question deleted');
      loadCatalog();
    } catch (e) {
      toast.error(handleApiError(e));
    }
  };

  const toggleQuestionActive = async (id: string, isActive: boolean) => {
    try {
      await updateLimitingBeliefQuestion(id, { isActive: !isActive });
      loadCatalog();
    } catch (e) {
      toast.error(handleApiError(e));
    }
  };

  const openAddBand = () => {
    setBandEdit(null);
    setBandMin(0);
    setBandMax(25);
    setBandLabel('');
    setBandDesc('');
    setBandOrder(catalog?.bands.length ?? 0);
    setBandModal('add');
  };

  const openEditBand = (b: AdminLimitingBeliefScoreBand) => {
    setBandEdit(b);
    setBandMin(b.minScore);
    setBandMax(b.maxScore);
    setBandLabel(b.label);
    setBandDesc(b.description || '');
    setBandOrder(b.sortOrder);
    setBandModal('edit');
  };

  const saveBand = async () => {
    try {
      if (bandModal === 'add') {
        await createLimitingBeliefScoreBand({
          minScore: bandMin,
          maxScore: bandMax,
          label: bandLabel,
          description: bandDesc || null,
          sortOrder: bandOrder,
        });
        toast.success('Score band created');
      } else if (bandModal === 'edit' && bandEdit) {
        await updateLimitingBeliefScoreBand(bandEdit.id, {
          minScore: bandMin,
          maxScore: bandMax,
          label: bandLabel,
          description: bandDesc || null,
          sortOrder: bandOrder,
        });
        toast.success('Score band updated');
      }
      setBandModal(null);
      loadCatalog();
    } catch (e) {
      toast.error(handleApiError(e));
    }
  };

  const removeBand = async (id: string) => {
    if (!confirm('Delete this score band?')) return;
    try {
      await deleteLimitingBeliefScoreBand(id);
      toast.success('Deleted');
      loadCatalog();
    } catch (e) {
      toast.error(handleApiError(e));
    }
  };

  const toggleBandActive = async (b: AdminLimitingBeliefScoreBand) => {
    try {
      await updateLimitingBeliefScoreBand(b.id, { isActive: !b.isActive });
      loadCatalog();
    } catch (e) {
      toast.error(handleApiError(e));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Strong Limiting Belief</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Manage sections, questions, and score feedback. Users see the live questionnaire on the dashboard.
          </p>
        </div>
        <Button variant="outline" onClick={() => (tab === 'attempts' ? loadAttempts() : loadCatalog())} disabled={loading}>
          <HiRefresh className="h-4 w-4 mr-1 inline" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {(['content', 'bands', 'attempts'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm font-medium rounded-none ${
              tab === t
                ? 'bg-[var(--primary-600)] text-white'
                : 'bg-[var(--muted)]/40 text-[var(--foreground)] hover:bg-[var(--muted)]/60'
            }`}
          >
            {t === 'content' ? 'Sections & questions' : t === 'bands' ? 'Score bands' : 'Learner attempts'}
          </button>
        ))}
      </div>

      {loading && !catalog ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
      ) : null}

      {tab === 'content' && catalog && (
        <div className="space-y-6">
          <Button onClick={openAddSection}>
            <HiPlus className="h-4 w-4 mr-1 inline" />
            Add section
          </Button>

          {catalog.sections.map((sec) => (
            <Card key={sec.id} padding="md" className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-[var(--muted-foreground)]">Order {sec.sortOrder}</div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">{sec.title}</h2>
                  <span className="text-xs text-[var(--muted-foreground)]">{sec.isActive ? 'Active' : 'Hidden'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleSectionActive(sec.id, sec.isActive)}>
                    {sec.isActive ? 'Hide' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditSection(sec.id, sec.title, sec.sortOrder)}>
                    <HiPencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => removeSection(sec.id, sec.title)}>
                    <HiTrash className="h-4 w-4 text-red-600" />
                  </Button>
                  <Button size="sm" onClick={() => openAddQuestion(sec.id)}>
                    <HiPlus className="h-4 w-4 mr-1 inline" />
                    Question
                  </Button>
                </div>
              </div>
              <ul className="space-y-2 border-t border-[var(--border)] pt-3">
                {sec.questions.map((q) => (
                  <li
                    key={q.id}
                    className="flex flex-wrap items-start justify-between gap-2 text-sm border border-[var(--border)]/60 p-2 rounded-none"
                  >
                    <span className={q.isActive ? '' : 'opacity-50 line-through'}>{q.text}</span>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => toggleQuestionActive(q.id, q.isActive)}>
                        {q.isActive ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditQuestion({ ...q, sectionId: sec.id })}
                      >
                        <HiPencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeQuestion(q.id)}>
                        <HiTrash className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {tab === 'bands' && catalog && (
        <div className="space-y-4">
          <Button onClick={openAddBand}>
            <HiPlus className="h-4 w-4 mr-1 inline" />
            Add score band
          </Button>
          <div className="overflow-x-auto border border-[var(--border)] rounded-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)]/40 text-left">
                  <th className="p-2">Range</th>
                  <th className="p-2">Label</th>
                  <th className="p-2">Order</th>
                  <th className="p-2">Active</th>
                  <th className="p-2 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...catalog.bands].sort((a, b) => a.sortOrder - b.sortOrder).map((b) => (
                  <tr key={b.id} className="border-t border-[var(--border)]">
                    <td className="p-2 tabular-nums">
                      {b.minScore} – {b.maxScore}
                    </td>
                    <td className="p-2">{b.label}</td>
                    <td className="p-2">{b.sortOrder}</td>
                    <td className="p-2">{b.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2 flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => toggleBandActive(b)}>
                        Toggle
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditBand(b)}>
                        <HiPencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeBand(b.id)}>
                        <HiTrash className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Published max score (active questions only): <strong>{catalog.maxScorePublished}</strong>. Bands should cover
            0–max for best UX.
          </p>
        </div>
      )}

      {tab === 'attempts' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">Total attempts: {attemptsTotal}</p>
          <div className="overflow-x-auto border border-[var(--border)] rounded-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)]/40 text-left">
                  <th className="p-2">When</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Band</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--border)]">
                    <td className="p-2 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="p-2">
                      <div className="font-medium">{a.user.fullName}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{a.user.email}</div>
                    </td>
                    <td className="p-2 tabular-nums">
                      {a.totalScore} / {a.maxScore}
                    </td>
                    <td className="p-2">{a.bandLabel || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={sectionModal !== null}
        onClose={() => setSectionModal(null)}
        title={sectionModal === 'add' ? 'Add section' : 'Edit section'}
      >
        <div className="space-y-3 p-1">
          <Input label="Title" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} />
          <Input
            label="Sort order"
            type="number"
            value={String(sectionOrder)}
            onChange={(e) => setSectionOrder(Number(e.target.value))}
          />
          <Button onClick={saveSection} disabled={!sectionTitle.trim()}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={questionModal !== null}
        onClose={() => setQuestionModal(null)}
        title={questionModal === 'add' ? 'Add question' : 'Edit question'}
      >
        <div className="space-y-3 p-1">
          <Textarea label="Statement" value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} />
          <Input
            label="Sort order"
            type="number"
            value={String(questionOrder)}
            onChange={(e) => setQuestionOrder(Number(e.target.value))}
          />
          <Button onClick={saveQuestion} disabled={!questionText.trim()}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={bandModal !== null}
        onClose={() => setBandModal(null)}
        title={bandModal === 'add' ? 'Add score band' : 'Edit score band'}
      >
        <div className="space-y-3 p-1">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Min score" type="number" value={String(bandMin)} onChange={(e) => setBandMin(Number(e.target.value))} />
            <Input label="Max score" type="number" value={String(bandMax)} onChange={(e) => setBandMax(Number(e.target.value))} />
          </div>
          <Input label="Label (feedback)" value={bandLabel} onChange={(e) => setBandLabel(e.target.value)} />
          <Textarea label="Description (optional)" value={bandDesc} onChange={(e) => setBandDesc(e.target.value)} rows={2} />
          <Input
            label="Sort order"
            type="number"
            value={String(bandOrder)}
            onChange={(e) => setBandOrder(Number(e.target.value))}
          />
          <Button onClick={saveBand} disabled={!bandLabel.trim()}>
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
