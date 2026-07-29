// Run EXACT same query as NestJS getEventLogs does
const {PrismaClient} = require('D:/Anta6 Documents/Github Gitlab/lovad-face-ai/cms_faceid_ai/apps/backend/generated/lcms');
const prisma = new PrismaClient();

async function main() {
  // Exact SQL from meeting.service.ts getEventLogs rawQuery (no filters)
  const rawRows = await prisma['$queryRaw']`
    SELECT
        ev.id AS event_id,
        es.object_id,
        es.camera_event_id,
        ev.create_time AS time_created,
        h.full_name,
        h.document_id,
        h.list_ids,
        ca.camera_friendly_name AS camera_name,
        ca.area_name,
        ev.ex_info,
        es.detail
    FROM event_vms_parent ev
    INNER JOIN event_statistic_parent es ON ev.source_id = es.id
    INNER JOIN human_info h             ON es.object_id = h.id
    LEFT  JOIN camera_area_event_source ca ON es.source_id = ca.area_id
    WHERE ev.is_valid = true AND ev.is_deleted = false
    ORDER BY ev.create_time DESC
    LIMIT 5
  `;

  console.log('=== EXACT NestJS query result ===');
  rawRows.forEach(r => {
    console.log(`\nevent_id: ${r.event_id}`);
    console.log(`full_name: ${r.full_name}`);
    console.log(`ex_info: "${r.ex_info}" (type: ${typeof r.ex_info})`);
    console.log(`detail: "${r.detail}" (type: ${typeof r.detail})`);
    
    // Simulate what mapRawEvent does now
    let accuracy = undefined;
    const exInfo = r.ex_info;
    const detail = r.detail;
    
    // Step 1: ex_info
    if (exInfo && typeof exInfo === 'string' && exInfo.trim() !== '' && exInfo.trim() !== '""') {
      try {
        const parsed = JSON.parse(exInfo);
        // findScoreInObject omitted for simplicity - just noting it would work on JSON
        console.log(`  ex_info is non-empty, would try JSON parse`);
      } catch(_) {}
    }
    
    // Step 2: detail - plain text regex
    if (accuracy === undefined && detail) {
      const detailStr = typeof detail === 'string' ? detail : JSON.stringify(detail);
      const pattern1 = /(?:độ\s*tin\s*cậy|confidence|accuracy|score)\s*[:\s]+(\d+(?:\.\d+)?)\s*%/i;
      const match = detailStr.match(pattern1);
      if (match) {
        accuracy = parseFloat(match[1]);
        console.log(`  → Parsed accuracy from detail regex: ${accuracy} (from "${detailStr}")`);
      } else {
        const pattern2 = /(\d+(?:\.\d+)?)\s*%/;
        const match2 = detailStr.match(pattern2);
        if (match2) {
          accuracy = parseFloat(match2[1]);
          console.log(`  → Parsed accuracy from pattern2: ${accuracy}`);
        } else {
          console.log(`  → No match in detail: "${detailStr}"`);
        }
      }
    }
    console.log(`  FINAL accuracy: ${accuracy}`);
  });
}

main().catch(console.error).finally(() => prisma['$disconnect']());
