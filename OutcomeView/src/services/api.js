export const fetchData = async(filename) => {
    try{
        const response = await fetch(`/${filename}`);
        if(!response.ok) throw new Error("Failed to fetch data");
        const text = await response.text();
        return text;
    } catch(error) {
        console.error("Error fetching data:", error);
        return null;
    }
}
// ${process.env.PUBLIC_URL}
