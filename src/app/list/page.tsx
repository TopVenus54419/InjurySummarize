/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { useEffect, useState } from "react";
import { getIncidentAnalysisHistory } from "~/lib/actions/generate-marketing-strength";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";

// IncidentAnalysis type based on Prisma schema
interface IncidentAnalysis {
  id: number;
  dateOfInjury: string;
  locationOfIncident: string;
  causeOfIncident: string;
  typeOfIncident: string;
  statutoryViolationsCited: string[];
  summary: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

function truncateWords(text: string, wordLimit: number) {
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "...";
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export default function IncidentAnalysisListPage() {
  const [items, setItems] = useState<IncidentAnalysis[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await getIncidentAnalysisHistory();
      if (res?.data?.history) {
        const mappedItems = res.data.history.map((item: any) => ({
          ...item,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toISOString(),
          updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date(item.updatedAt).toISOString(),
        }));
        setItems(mappedItems);
        const userIds = Array.from(new Set(mappedItems.map((item) => item.userId)));
        const userMap: Record<string, string> = {};
        await Promise.all(userIds.map(async (id) => {
          try {
            const resp = await fetch(`/api/clerk-user?userId=${id}`);
            const data: { username?: string; email?: string } = await resp.json();
            userMap[String(id)] = data.username ?? data.email ?? String(id);
          } catch {
            userMap[String(id)] = String(id);
          }
        }));
        setUsernames(userMap);
      }
      setLoading(false);
    })();
  }, []);

  const selected: IncidentAnalysis | null = (selectedIdx !== null && items[selectedIdx] !== undefined) ? items[selectedIdx] : null;

  const handlePrev = () => {
    if (selectedIdx === null || items.length === 0) return;
    setSelectedIdx((selectedIdx - 1 + items.length) % items.length);
  };
  const handleNext = () => {
    if (selectedIdx === null || items.length === 0) return;
    setSelectedIdx((selectedIdx + 1) % items.length);
  };

  return (
    <div className="container mx-auto py-12 pt-24">
      <h1 className="text-3xl font-bold mb-8 text-center">Incident Analysis List</h1>
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>
          <span className="ml-4 text-blue-700 font-semibold">Loading...</span>
        </div>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-black uppercase">Username</th>
                    <th className="px-4 py-2 text-left font-semibold text-black uppercase">Date of Injury</th>
                    <th className="px-4 py-2 text-left font-semibold text-black uppercase">Location</th>
                    <th className="px-4 py-2 text-left font-semibold text-black uppercase">Cause</th>
                    <th className="px-4 py-2 text-left font-semibold text-black uppercase">Type</th>
                    <th className="px-4 py-2 text-left font-semibold text-black uppercase">Statutory Violations</th>
                    <th className="px-4 py-2 text-left font-semibold text-black uppercase">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 cursor-pointer`}
                      onClick={() => { setSelectedIdx(idx); setShowModal(true); }}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-black">{truncateWords(usernames[item.userId] ?? item.userId, 2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-black">{truncateWords(item.dateOfInjury, 2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-black">{truncateWords(item.locationOfIncident, 2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-black">{truncateWords(item.causeOfIncident, 2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-black">{truncateWords(item.typeOfIncident, 2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-black">{truncateWords(item.statutoryViolationsCited.join(", "), 2)}</td>
                      <td className="px-4 py-2 max-w-xs flex items-center gap-2 text-black">
                        <span>
                          {expandedSummary === idx ? item.summary : truncateWords(item.summary, 2)}
                        </span>
                        <button
                          className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                          onClick={e => { e.stopPropagation(); setExpandedSummary(expandedSummary === idx ? null : idx); }}
                          aria-label={expandedSummary === idx ? "Hide full summary" : "Show full summary"}
                        >
                          {expandedSummary === idx ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal for details */}
      {!loading && (
        <Modal open={showModal} onClose={() => setShowModal(false)}>
          <h2 className="text-xl font-bold mb-2">Incident Analysis Details</h2>
          {selected && (
            <div className="space-y-2">
              <div><b>Username:</b> {usernames[selected.userId] ?? selected.userId}</div>
              <div><b>Date of Injury:</b> {selected.dateOfInjury}</div>
              <div><b>Location of Incident:</b> {selected.locationOfIncident}</div>
              <div><b>Cause of Incident:</b> {selected.causeOfIncident}</div>
              <div><b>Type of Incident:</b> {selected.typeOfIncident}</div>
              <div><b>Statutory Violations Cited:</b> {selected.statutoryViolationsCited.join(", ")}</div>
              <Separator />
              <div><b>Summary:</b></div>
              <div className="whitespace-pre-line bg-gray-100 rounded p-2 max-h-64 overflow-auto">{selected.summary}</div>
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={handlePrev}>Previous</Button>
                <Button variant="outline" onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}
          <Button className="mt-4 w-full" onClick={() => setShowModal(false)}>Close</Button>
        </Modal>
      )}
    </div>
  );
} 