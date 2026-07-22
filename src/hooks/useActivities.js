import { useEffect, useState } from 'react';

export function useActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/activities')
      .then((res) => res.json())
      .then((data) => setActivities(data.activities || []))
      .finally(() => setLoading(false));
  }, []);

  return { activities, loading };
}
