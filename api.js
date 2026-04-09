const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "philippine_schools.json");

let schools = [];

function loadData() {
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  schools = Array.isArray(parsed.data) ? parsed.data : [];
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function includesText(value, searchText) {
  return normalize(value).includes(searchText);
}

function applyFilters(items, query) {
  const q = normalize(query.q);
  const region = normalize(query.region);
  const regionId = normalize(query.region_id);
  const type = normalize(query.type);
  const category = normalize(query.category);
  const curricular = normalize(query.curricular_classification);

  return items.filter((school) => {
    if (q) {
      const haystacks = [school.id, school.name, school.head, school.address, school.region];
      const matchesQ = haystacks.some((field) => includesText(field, q));
      if (!matchesQ) {
        return false;
      }
    }

    if (region && !includesText(school.region, region)) {
      return false;
    }

    if (regionId && normalize(school.region_id) !== regionId) {
      return false;
    }

    if (type && normalize(school.type) !== type) {
      return false;
    }

    if (category && normalize(school.category) !== category) {
      return false;
    }

    if (curricular && !includesText(school.curricular_classification, curricular)) {
      return false;
    }

    return true;
  });
}

function sortItems(items, sortBy, order) {
  const allowedSortFields = new Set(["id", "name", "region", "type", "category"]);
  const field = allowedSortFields.has(sortBy) ? sortBy : "name";
  const multiplier = order === "desc" ? -1 : 1;

  return [...items].sort((a, b) => {
    const av = normalize(a[field]);
    const bv = normalize(b[field]);
    if (av < bv) {
      return -1 * multiplier;
    }
    if (av > bv) {
      return 1 * multiplier;
    }
    return 0;
  });
}

function handleListSchools(res, query) {
  const page = parseInteger(query.page, 1);
  const limit = Math.min(parseInteger(query.limit, 25), 200);
  const sortBy = normalize(query.sort_by) || "name";
  const order = normalize(query.order) === "desc" ? "desc" : "asc";

  const filtered = applyFilters(schools, query);
  const sorted = sortItems(filtered, sortBy, order);

  const total = sorted.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const data = sorted.slice(start, start + limit);

  sendJson(res, 200, {
    meta: {
      total,
      page: safePage,
      limit,
      total_pages: totalPages,
      has_next_page: safePage < totalPages,
      has_prev_page: safePage > 1,
    },
    data,
  });
}

function handleGetSchoolById(res, schoolId) {
  const match = schools.find((school) => String(school.id) === schoolId);

  if (!match) {
    sendJson(res, 404, {
      error: "School not found",
      message: `No school found with id '${schoolId}'.`,
    });
    return;
  }

  sendJson(res, 200, { data: match });
}

function handleRegions(res) {
  const regionMap = new Map();

  for (const school of schools) {
    const key = `${school.region_id}::${school.region}`;
    const current = regionMap.get(key) || {
      region_id: school.region_id,
      region: school.region,
      total_schools: 0,
    };
    current.total_schools += 1;
    regionMap.set(key, current);
  }

  const data = Array.from(regionMap.values()).sort((a, b) => {
    const aid = normalize(a.region_id);
    const bid = normalize(b.region_id);
    if (aid < bid) {
      return -1;
    }
    if (aid > bid) {
      return 1;
    }
    return 0;
  });

  sendJson(res, 200, { data });
}

function requestHandler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, {
      error: "Method not allowed",
      message: "Only GET requests are supported.",
    });
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;
  const query = Object.fromEntries(requestUrl.searchParams.entries());

  if (pathname === "/") {
    sendJson(res, 200, {
      name: "Philippine Schools API",
      version: "1.0.0",
      endpoints: [
        "GET /health",
        "GET /api/schools",
        "GET /api/schools/:id",
        "GET /api/regions",
      ],
      total_schools: schools.length,
    });
    return;
  }

  if (pathname === "/health") {
    sendJson(res, 200, {
      status: "ok",
      total_schools: schools.length,
    });
    return;
  }

  if (pathname === "/api/schools") {
    handleListSchools(res, query);
    return;
  }

  if (pathname.startsWith("/api/schools/")) {
    const schoolId = decodeURIComponent(pathname.replace("/api/schools/", "")).trim();
    handleGetSchoolById(res, schoolId);
    return;
  }

  if (pathname === "/api/regions") {
    handleRegions(res);
    return;
  }

  sendJson(res, 404, {
    error: "Not found",
    message: "The requested endpoint does not exist.",
  });
}

try {
  loadData();
} catch (error) {
  console.error("Failed to load dataset:", error.message);
  process.exit(1);
}

const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`Philippine Schools API running on http://localhost:${PORT}`);
  console.log(`Loaded ${schools.length} schools from ${path.basename(DATA_FILE)}`);
});
