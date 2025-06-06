export const fetchSLOs = async () => {
    try {
        const response = await fetch('/api/slos');
        if (!response.ok) throw new Error("Failed to fetch SLOs");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching SLOs:", error);
        return [];
    }
};

export const fetchCourseSLOs = async () => {
    try {
        const response = await fetch('/api/course-slos');
        if (!response.ok) throw new Error("Failed to fetch course SLOs");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching course SLOs:", error);
        return [];
    }
};

export const fetchPIs = async () => {
    try {
        const response = await fetch('/api/pis');
        if (!response.ok) throw new Error("Failed to fetch PIs");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching PIs:", error);
        return [];
    }
};

export const fetchRubrics = async () => {
    try {
        const response = await fetch("/api/rubrics");
        if (!response.ok) throw new Error("Failed to fetch rubrics");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching rubrics:", error);
        return [];
    }
};
