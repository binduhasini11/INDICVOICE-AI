const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatTravelDates(travelDate) {
  const now = new Date();
  let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  if (travelDate && typeof travelDate === "string") {
    const dStr = travelDate.trim().toLowerCase();
    if (dStr === "today" || dStr === "innaiku" || dStr === "indru" || dStr === "aaj") {
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dStr === "tomorrow" || dStr === "naalaiku" || dStr === "naalai" || dStr === "kal") {
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (dStr === "day after tomorrow" || dStr === "naalanniki" || dStr === "parson") {
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    } else {
      const isoMatch = dStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (isoMatch) {
        targetDate = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
      } else {
        const dmyMatch = dStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (dmyMatch) {
          targetDate = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
        } else {
          const parsed = new Date(travelDate);
          if (!isNaN(parsed.getTime())) {
            targetDate = parsed;
          }
        }
      }
    }
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const monName = MONTHS_SHORT[targetDate.getMonth()];

  return {
    dojRedBus: `${dd}-${monName}-${yyyy}`,
    dmySlash: `${dd}/${mm}/${yyyy}`,
    dmyDash: `${dd}-${mm}-${yyyy}`,
    compactDate: `${yyyy}${mm}${dd}`,
  };
}

const CITY_STATION_CODES = {
  chennai: { stn: "MAS", air: "MAA" },
  bengaluru: { stn: "SBC", air: "BLR" },
  bangalore: { stn: "SBC", air: "BLR" },
  hyderabad: { stn: "HYB", air: "HYD" },
  secunderabad: { stn: "SC", air: "HYD" },
  delhi: { stn: "NDLS", air: "DEL" },
  mumbai: { stn: "CSMT", air: "BOM" },
  kolkata: { stn: "HWH", air: "CCU" },
  pune: { stn: "PUNE", air: "PNQ" },
  ahmedabad: { stn: "ADI", air: "AMD" },
  jaipur: { stn: "JP", air: "JAI" },
  coimbatore: { stn: "CBE", air: "CJB" },
  madurai: { stn: "MDU", air: "IXM" },
  kochi: { stn: "ERS", air: "COK" },
  cochin: { stn: "ERS", air: "COK" },
  goa: { stn: "MAO", air: "GOI" },
  chandigarh: { stn: "CDG", air: "IXC" },
  lucknow: { stn: "LKO", air: "LKO" },
  varanasi: { stn: "BSB", air: "VNS" },
  visakhapatnam: { stn: "VSKP", air: "VTZ" },
  vizag: { stn: "VSKP", air: "VTZ" },
  mysuru: { stn: "MYS", air: "MYQ" },
  mysore: { stn: "MYS", air: "MYQ" },
};

export function getCityCodes(cityName) {
  const norm = (cityName || "").toLowerCase().trim();
  return CITY_STATION_CODES[norm] || {
    stn: norm.slice(0, 3).toUpperCase(),
    air: norm.slice(0, 3).toUpperCase(),
  };
}

export function getVerifiedTravelUrl(result) {
  if (!result) return null;
  const meta = result.metadata || {};
  const transport = (meta.transport || result.transport || result.type || "").toLowerCase();
  const rawUrl = result.url;
  const journeyDate = meta.date || result.date || meta.travel_date || result.travel_date;
  const origin = meta.origin || result.origin || "";
  const destination = meta.destination || result.destination || "";
  const dateFmts = formatTravelDates(journeyDate);

  if (transport === "bus") {
    const operator = meta.operator || result.source || "";
    const busType = meta.bus_type || "";

    const isInvalid =
      !rawUrl ||
      typeof rawUrl !== "string" ||
      rawUrl === "#" ||
      rawUrl.includes("localhost") ||
      rawUrl.includes("example.com");

    if (isInvalid || !rawUrl.includes("redbus.in")) {
      const origSlug = origin.toLowerCase().replace(/[^a-z0-9]/g, "");
      const destSlug = destination.toLowerCase().replace(/[^a-z0-9]/g, "");
      let redbusUrl = `https://www.redbus.in/bus-tickets/${origSlug}-to-${destSlug}`;
      const params = new URLSearchParams();
      if (operator && operator !== "Demo Operator") params.append("operator", operator);
      if (busType) params.append("busType", busType);
      if (dateFmts.dojRedBus) params.append("doj", dateFmts.dojRedBus);
      const q = params.toString();
      return q ? `${redbusUrl}?${q}` : redbusUrl;
    }
    return rawUrl;
  }

  if (transport === "train") {
    const oCodes = getCityCodes(origin);
    const dCodes = getCityCodes(destination);
    const trainNo = meta.train_no || meta.train_number || "";
    let irctc = `https://www.irctc.co.in/nget/booking/train-list?fromStn=${oCodes.stn}&toStn=${dCodes.stn}&journeyDate=${dateFmts.dmyDash}`;
    if (trainNo) irctc += `&trainNo=${encodeURIComponent(trainNo)}`;
    return rawUrl && !rawUrl.includes("localhost") && !rawUrl.includes("example.com") ? rawUrl : irctc;
  }

  if (transport === "flight") {
    const oCodes = getCityCodes(origin);
    const dCodes = getCityCodes(destination);
    const mmt = `https://www.makemytrip.com/flight/search?itinerary=${oCodes.air}-${dCodes.air}-${dateFmts.dmySlash}&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E`;
    return rawUrl && !rawUrl.includes("localhost") && !rawUrl.includes("example.com") ? rawUrl : mmt;
  }

  return rawUrl || null;
}

export function getProductStoreUrl(result) {
  if (!result) return null;
  const rawUrl = result.url;
  if (rawUrl && typeof rawUrl === "string" && rawUrl.startsWith("http") && !rawUrl.includes("example.com")) {
    return rawUrl;
  }
  const query = result.title || result.name || "products";
  const store = (result.source || "").toLowerCase();
  if (store.includes("flipkart")) {
    return `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
  }
  return `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
}
