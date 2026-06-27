import { useState } from "react";
import emailjs from "@emailjs/browser";

export const useSendBulkInterviewEmails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendBulkEmails = async (candidates) => {
    setLoading(true);
    setError(null);

    try {
      const promises = candidates.map((candidate) =>
        emailjs.send(
          import.meta.env.VITE_SERVICEID_EMAILJS,
          import.meta.env.VITE_TEMPLATEID_EMAILJS,
          {
            name: candidate.name,
            email: candidate.email,
            position: candidate.jobTitle,
          },
          import.meta.env.VITE_PUBLIBKEY_EMAILJS
        )
      );

      await Promise.all(promises);

      setLoading(false);
      return true;
    } catch (err) {
      setError(err);
      setLoading(false);
      return false;
    }
  };

  return { sendBulkEmails, loading, error };
};