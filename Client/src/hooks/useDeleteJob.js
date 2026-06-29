import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

export const useDeleteJob = () => {
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    
    const deleteJob = async (jobId, callback) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;
        console.log("Deleting job with ID:", jobId);
        setIsDeleting(true);
        try {
            const response = await api.delete(`/job/${jobId}`);
            if (response.data.signal === "JOB_DELETED_SUCCESSFULLY") {
                toast.success("Job deleted successfully!");
                
                if (callback) callback();

                navigate('/job-management');
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            const msg = error.response?.data?.signal || "Failed to delete job";
            toast.error(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    return { deleteJob, isDeleting };
};