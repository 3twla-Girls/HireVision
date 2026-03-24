import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, FileText } from 'lucide-react';

const ApplyModal = ({ setShowApply, jobTitle, jobId, candidateId }) => {

  const [cvs, setCvs] = useState([]);
  const [loadingCvs, setLoadingCvs] = useState(true);
  const [selectedCv, setSelectedCv] = useState(null);
  const [yearsOfExp, setYearsOfExp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch candidate's CVs on mount
  useEffect(() => {
    const fetchCvs = async () => {
      if (!candidateId) return;
      try {
        setLoadingCvs(true);
        const res = await fetch(`/api/v1/cv/user/${candidateId}`);
        if (!res.ok) throw new Error('Failed to fetch CVs');
        const data = await res.json();
        const list = data.cvs ?? [];
        setCvs(list);
        if (list.length > 0) setSelectedCv(list[0]);
      } catch (err) {
        console.error(err);
        toast.error('Could not load your CVs.');
      } finally {
        setLoadingCvs(false);
      }
    };
    fetchCvs();
  }, [candidateId]);

  const onClose = () => setShowApply(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCv) {
      toast.error('Please select a CV before submitting.');
      return;
    }

    const payload = {
      job_id: jobId,
      candidate_id: candidateId,
      years_of_exp: parseInt(yearsOfExp, 10),
      candidate_cv_id: selectedCv.id,
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/v1/application/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.signal || 'Submission failed');
      }

      toast.success('Application submitted successfully!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date nicely
  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return iso; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className="flex justify-between items-center px-10 py-6 border-b border-gray-100">
          <h2 className="text-2xl font-medium text-dark-blue">
            Apply for: <span className="font-bold ml-1">{jobTitle || 'Job Position Title'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-3xl font-bold text-dark-blue hover:text-red-500 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form className="p-10 pb-4 space-y-8" onSubmit={handleSubmit}>

          {/* Experience Field */}
          <div className="space-y-3">
            <label className="block text-lg font-medium text-dark-blue">
              Your years of experience in this field:
            </label>
            <input
              type="number"
              required
              min="0"
              placeholder="e.g. 3"
              value={yearsOfExp}
              onChange={(e) => setYearsOfExp(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-400 outline-none transition-all"
            />
          </div>

          {/* Resume Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-blue">Choose a CV</h3>

            {loadingCvs ? (
              <div className="flex items-center gap-3 text-light-blue py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading your CVs…</span>
              </div>
            ) : cvs.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 text-sm">
                No CVs uploaded yet. Please upload a CV from your profile first.
              </div>
            ) : (
              <div className="space-y-3">
                {cvs.map((cv) => (
                  <label
                    key={cv.id}
                    onClick={() => setSelectedCv(cv)}
                    className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCv?.id === cv.id
                        ? 'border-dark-blue bg-gray-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      <FileText className="w-5 h-5 text-dark-blue shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-medium text-dark-blue text-sm">{cv.cv_name}</span>
                        <span className="text-xs text-light-blue">Uploaded {formatDate(cv.created_at)}</span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="cv"
                      className="w-5 h-5 accent-dark-blue"
                      checked={selectedCv?.id === cv.id}
                      readOnly
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Action Button */}
          <div className="p-10 pt-0 flex justify-end">
            <button
              className="bg-dark-blue text-white px-12 py-3 rounded-lg font-bold text-lg hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={submitting || loadingCvs || cvs.length === 0}
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ApplyModal;