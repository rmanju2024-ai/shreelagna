function pathFor(label: string) {
  const t = label.toLowerCase();
  if (t.includes("tongue") || t.includes("language")) return "M4 12h16M8 8c2-3 12-3 14 0M8 16c2 3 12 3 14 0";
  if (t.includes("community") || t.includes("caste") || t.includes("religion") || t.includes("faith"))
    return "M12 3l2.4 4.8L20 9l-4 3.9.9 5.4L12 16.2 7.1 18.3 8 12.9 4 9l5.6-1.2z";
  if (t.includes("height") || t.includes("age") || t.includes("year")) return "M6 4v16M18 4v16M6 8h12M6 16h12";
  if (t.includes("country") || t.includes("city") || t.includes("state") || t.includes("place") || t.includes("location") || t.includes("grew"))
    return "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zm0-8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z";
  if (t.includes("mobile") || t.includes("email") || t.includes("contact"))
    return "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 16h4";
  if (t.includes("blood") || t.includes("health") || t.includes("habit") || t.includes("diet"))
    return "M12 3s7 7.2 7 11.2A7 7 0 1 1 5 14.2C5 10.2 12 3 12 3z";
  if (t.includes("marital") || t.includes("partner") || t.includes("match") || t.includes("hope"))
    return "M12 20s-7-4.4-7-9.2C5 8 7.2 6 9.5 6c1.4 0 2.5.7 2.5 1.8C12 6.7 13.1 6 14.5 6 16.8 6 19 8 19 10.8 19 15.6 12 20 12 20z";
  if (t.includes("work") || t.includes("employ") || t.includes("occupation") || t.includes("college") || t.includes("qualif") || t.includes("income") || t.includes("ambition"))
    return "M3 9h18v10H3zM8 9V6h8v3";
  if (t.includes("family") || t.includes("father") || t.includes("mother") || t.includes("brother") || t.includes("sister") || t.includes("sibling") || t.includes("who"))
    return "M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 20v-1.2A3.8 3.8 0 0 1 7.8 15h1.4m5.6 0h1.4A3.8 3.8 0 0 1 20 18.8V20";
  if (t.includes("name") || t.includes("surname") || t.includes("identity")) return "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 9v-1.5A5.5 5.5 0 0 1 10.5 14h3A5.5 5.5 0 0 1 19 19.5V21";
  if (t.includes("birth") || t.includes("date") || t.includes("time") || t.includes("kundali") || t.includes("rashi") || t.includes("nakshatra") || t.includes("gotra") || t.includes("lagna") || t.includes("gana") || t.includes("manglik") || t.includes("yoni"))
    return "M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z";
  if (t.includes("photo") || t.includes("album")) return "M4 7h4l2-2h4l2 2h4v12H4zM12 17a4 4 0 1 0-4-4 4 4 0 0 0 4 4z";
  if (t.includes("about") || t.includes("story") || t.includes("intro")) return "M5 5h14v14H5zM8 9h8M8 13h6";
  if (t.includes("citizen") || t.includes("settle") || t.includes("living") || t.includes("abroad"))
    return "M4 20V9l8-5 8 5v11H4zm8-7v7";
  if (t.includes("hobby")) return "M12 3l2 6h6l-5 4 2 6-5-3.5L7 19l2-6-5-4h6z";
  return "M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.2 6.4 19.5 8.5 12.8 3 8.8h6.8z";
}

export function FieldMark({ label }: { label: string }) {
  return (
    <svg className="field-mark" viewBox="0 0 24 24" aria-hidden>
      <path d={pathFor(label)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
