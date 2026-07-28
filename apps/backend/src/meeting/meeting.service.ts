import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/cms_webserver';
import { CmsPrismaService } from '../prisma/cms-prisma.service';
import { LcmsPrismaService } from '../prisma/lcms-prisma.service';

export interface MeetingGroup {
  id: string;
  name: string;
}

export interface MeetingWithGroups {
  id: string;
  title: string;
  location_id: string;
  group_ids: string[];
  groups: MeetingGroup[];
  time_start: string;
  time_end: string;
  date_organize: Date;
  time_before_begin: number;
  time_after_end: number;
}

export interface CreateMeetingDto {
  title: string;
  location_id: string;
  group_ids: string[];
  time_start: string;
  time_end: string;
  date_organize: string;
  time_before_begin?: number;
  time_after_end?: number;
}

export interface UpdateMeetingDto {
  title?: string;
  location_id?: string;
  group_ids?: string[];
  time_start?: string;
  time_end?: string;
  date_organize?: string;
  time_before_begin?: number;
  time_after_end?: number;
}

// Prisma error code for "record to update/delete does not exist".
const PRISMA_NOT_FOUND = 'P2025';

const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

@Injectable()
export class MeetingService {
  constructor(
    private readonly cms: CmsPrismaService,
    // group_ids tham chiếu tới bảng human_list, nằm ở DB lcms.
    private readonly lcms: LcmsPrismaService,
  ) {}

  private validate(dto: CreateMeetingDto | UpdateMeetingDto, isCreate: boolean) {
    if (isCreate || dto.title !== undefined) {
      if (!dto.title?.trim()) {
        throw new BadRequestException('title không được để trống');
      }
    }
    if (isCreate || dto.location_id !== undefined) {
      if (!dto.location_id?.trim()) {
        throw new BadRequestException('location_id không được để trống');
      }
    }
    if (isCreate || dto.group_ids !== undefined) {
      if (!Array.isArray(dto.group_ids) || dto.group_ids.length === 0) {
        throw new BadRequestException('group_ids không được để trống');
      }
    }
    if (isCreate || dto.time_start !== undefined) {
      if (!dto.time_start || !TIME_HHMM_REGEX.test(dto.time_start)) {
        throw new BadRequestException('time_start phải có định dạng "HH:mm"');
      }
    }
    if (isCreate || dto.time_end !== undefined) {
      if (!dto.time_end || !TIME_HHMM_REGEX.test(dto.time_end)) {
        throw new BadRequestException('time_end phải có định dạng "HH:mm"');
      }
    }
    if (isCreate || dto.date_organize !== undefined) {
      if (!dto.date_organize || Number.isNaN(new Date(dto.date_organize).getTime())) {
        throw new BadRequestException('date_organize không hợp lệ');
      }
    }
    if (dto.time_before_begin !== undefined && dto.time_before_begin < 0) {
      throw new BadRequestException('time_before_begin không được âm');
    }
    if (dto.time_after_end !== undefined && dto.time_after_end < 0) {
      throw new BadRequestException('time_after_end không được âm');
    }
  }

  // Resolve group_ids (ids of human_list rows, stored in the lcms DB) to
  // { id, name } pairs so the UI can display group names without a second
  // round-trip. Falls back to using the raw id as the name if not found.
  private async resolveGroups(groupIds: string[]): Promise<MeetingGroup[]> {
    if (groupIds.length === 0) return [];

    const lists = await this.lcms.human_list.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(lists.map(l => [l.id, l.name]));

    return groupIds.map(id => ({ id, name: nameById.get(id) || id }));
  }

  private async toMeetingWithGroups(row: {
    id: string;
    title: string;
    location_id: string;
    group_ids: string[];
    time_start: string;
    time_end: string;
    date_organize: Date;
    time_before_begin: number;
    time_after_end: number;
  }): Promise<MeetingWithGroups> {
    const groups = await this.resolveGroups(row.group_ids);
    return {
      id: row.id,
      title: row.title,
      location_id: row.location_id,
      group_ids: row.group_ids,
      groups,
      time_start: row.time_start,
      time_end: row.time_end,
      date_organize: row.date_organize,
      time_before_begin: row.time_before_begin,
      time_after_end: row.time_after_end,
    };
  }

  async findAll(): Promise<MeetingWithGroups[]> {
    const meetings = await this.cms.meeting.findMany({
      orderBy: { time_created: 'asc' },
    });
    return Promise.all(meetings.map(m => this.toMeetingWithGroups(m)));
  }

  async findOne(id: string): Promise<MeetingWithGroups | null> {
    const meeting = await this.cms.meeting.findUnique({ where: { id } });
    if (!meeting) return null;
    return this.toMeetingWithGroups(meeting);
  }

  async create(dto: CreateMeetingDto): Promise<MeetingWithGroups> {
    this.validate(dto, true);

    const location = await this.cms.location.findUnique({ where: { id: dto.location_id } });
    if (!location) {
      throw new BadRequestException(`Không tìm thấy location id "${dto.location_id}"`);
    }

    const meeting = await this.cms.meeting.create({
      data: {
        id: randomUUID(),
        title: dto.title.trim(),
        location_id: dto.location_id,
        group_ids: dto.group_ids,
        time_start: dto.time_start,
        time_end: dto.time_end,
        date_organize: new Date(dto.date_organize),
        time_before_begin: dto.time_before_begin ?? 30,
        time_after_end: dto.time_after_end ?? 30,
      },
    });

    return this.toMeetingWithGroups(meeting);
  }

  async update(id: string, dto: UpdateMeetingDto): Promise<MeetingWithGroups> {
    this.validate(dto, false);

    if (dto.location_id !== undefined) {
      const location = await this.cms.location.findUnique({ where: { id: dto.location_id } });
      if (!location) {
        throw new BadRequestException(`Không tìm thấy location id "${dto.location_id}"`);
      }
    }

    try {
      const meeting = await this.cms.meeting.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.location_id !== undefined ? { location_id: dto.location_id } : {}),
          ...(dto.group_ids !== undefined ? { group_ids: dto.group_ids } : {}),
          ...(dto.time_start !== undefined ? { time_start: dto.time_start } : {}),
          ...(dto.time_end !== undefined ? { time_end: dto.time_end } : {}),
          ...(dto.date_organize !== undefined ? { date_organize: new Date(dto.date_organize) } : {}),
          ...(dto.time_before_begin !== undefined ? { time_before_begin: dto.time_before_begin } : {}),
          ...(dto.time_after_end !== undefined ? { time_after_end: dto.time_after_end } : {}),
        },
      });

      return this.toMeetingWithGroups(meeting);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === PRISMA_NOT_FOUND) {
        throw new NotFoundException(`Không tìm thấy meeting id "${id}"`);
      }
      throw e;
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    try {
      await this.cms.meeting.delete({ where: { id } });
      return { id };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === PRISMA_NOT_FOUND) {
        throw new NotFoundException(`Không tìm thấy meeting id "${id}"`);
      }
      throw e;
    }
  }

  async getAttendanceReport(meetingId: string) {
    const meeting = await this.cms.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) {
      throw new NotFoundException(`Không tìm thấy meeting id "${meetingId}"`);
    }

    // 1. Fetch location camera binds
    const binds = await this.cms.location_camera_bind.findMany({
      where: { location_id: meeting.location_id },
    });

    const checkinCameraIds = binds
      .filter(b => b.role.includes('checkin') || b.role.length === 0)
      .map(b => b.camera_id);
    const checkoutCameraIds = binds
      .filter(b => b.role.includes('checkout') || b.role.length === 0)
      .map(b => b.camera_id);

    // If no cameras at all, we can't query logs
    if (binds.length === 0) {
      return {
        checkinEvents: [],
        checkoutEvents: [],
      };
    }

    // 2. Calculate time range (returns YYYY-MM-DD HH:mm:ss local string to avoid UTC/Z offset issues)
    const getOffsetDateTime = (date: Date, timeStr: string, offsetMinutes: number): string => {
      const [h, m] = timeStr.split(':').map(Number);
      const res = new Date(date);
      res.setHours(h, m, 0, 0);
      res.setMinutes(res.getMinutes() + offsetMinutes);
      
      const pad = (n: number) => String(n).padStart(2, '0');
      const yyyy = res.getFullYear();
      const mm = pad(res.getMonth() + 1);
      const dd = pad(res.getDate());
      const hh = pad(res.getHours());
      const min = pad(res.getMinutes());
      const ss = pad(res.getSeconds());
      
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };

    const startTime = getOffsetDateTime(meeting.date_organize, meeting.time_start, -meeting.time_before_begin);
    const endTime = getOffsetDateTime(meeting.date_organize, meeting.time_end, meeting.time_after_end);

        // 3. Execute queries
    const query = `
      SELECT 
          es.object_id,
          ev.create_time AS time_created,
          h.full_name,
          h.cropped_face_images,
          ca.camera_friendly_name AS camera_name,
          ca.area_name,
          -- Bổ sung 2 trường ảnh chụp sự kiện thực tế từ ổ đĩa
          ei_full.image_path AS full_image_path, -- Đường dẫn ảnh toàn cảnh (type = 1)
          ei_face.image_path AS face_image_path  -- Đường dẫn ảnh cắt khuôn mặt (type = 4)
      FROM event_vms_parent ev
      INNER JOIN event_statistic_parent es 
          ON ev.source_id = es.id
      INNER JOIN human_info h 
          ON es.object_id = h.id
      LEFT JOIN camera_area_event_source ca 
          ON es.source_id = ca.area_id
      -- LEFT JOIN lấy ảnh toàn cảnh (Type = 1)
      LEFT JOIN event_image_parent ei_full
          ON ev.source_id = ei_full.statistic_id AND ei_full.type = 1
      -- LEFT JOIN lấy ảnh khuôn mặt tại sự kiện (Type = 4)
      LEFT JOIN event_image_parent ei_face
          ON ev.source_id = ei_face.statistic_id AND ei_face.type = 4
      WHERE 
          ev.create_time >= $1::timestamp 
          AND ev.create_time <= $2::timestamp
          AND es.camera_event_id = ANY($3::varchar[])
          AND h.list_ids && $4::varchar[]
          AND (ca.area_name ILIKE '%diem danh%' OR ca.area_name ILIKE '%điểm danh%')
          AND ev.is_valid = true 
          AND ev.is_deleted = false
      ORDER BY ev.create_time DESC;
    `;

    const mapEvent = (e: any) => {
      let faceImgBase64: string | null = null;
      if (e.cropped_face_images) {
        const buffers = e.cropped_face_images;
        if (Array.isArray(buffers) && buffers.length > 0) {
          const buf = buffers[0];
          if (buf) {
            const rawBuf = Buffer.isBuffer(buf) ? buf : (buf.data ? Buffer.from(buf.data) : null);
            if (rawBuf) {
              faceImgBase64 = `data:image/jpeg;base64,${rawBuf.toString('base64')}`;
            }
          }
        } else if (Buffer.isBuffer(buffers)) {
          faceImgBase64 = `data:image/jpeg;base64,${buffers.toString('base64')}`;
        }
      }
      return {
        ...e,
        cropped_face_images: faceImgBase64 ? [faceImgBase64] : []
      };
    };

    // Run check-in and check-out queries in parallel
    const [checkinEventsRaw, checkoutEventsRaw] = await Promise.all([
      checkinCameraIds.length > 0
        ? this.lcms.$queryRawUnsafe<any[]>(query, startTime, endTime, checkinCameraIds, meeting.group_ids)
        : Promise.resolve([]),
      checkoutCameraIds.length > 0
        ? this.lcms.$queryRawUnsafe<any[]>(query, startTime, endTime, checkoutCameraIds, meeting.group_ids)
        : Promise.resolve([]),
    ]);

    const checkinEvents = checkinEventsRaw.map(mapEvent);
    const checkoutEvents = checkoutEventsRaw.map(mapEvent);

    /* ==========================================
    // THUẬT TOÁN CŨ (ĐÃ ĐÓNG BĂNG)
    const attendanceMap = new Map<string, {
      employeeId: string;
      thoiGianVao: string | null;
      thoiGianRa: string | null;
      entryEvent: any;
      exitEvent: any;
    }>();

    const extractLocalTimeStr = (dateVal: Date | string): string | null => {
      const formatted = this.formatDateToLocalString(dateVal);
      if (!formatted) return null;
      return formatted.split('-')[1] || null;
    };

    // 1. Process check-ins: find earliest check-in for each object_id
    const checkinsByEmp = new Map<string, any[]>();
    for (const evt of checkinEvents) {
      const empId = evt.object_id;
      if (!checkinsByEmp.has(empId)) {
        checkinsByEmp.set(empId, []);
      }
      checkinsByEmp.get(empId)!.push(evt);
    }

    for (const [empId, evts] of checkinsByEmp.entries()) {
      evts.sort((a, b) => new Date(a.time_created).getTime() - new Date(b.time_created).getTime());
      const earliest = evts[0];
      attendanceMap.set(empId, {
        employeeId: empId,
        thoiGianVao: earliest.time_created ? extractLocalTimeStr(earliest.time_created) : null,
        thoiGianRa: null,
        entryEvent: earliest,
        exitEvent: null,
      });
    }

    // 2. Process check-outs: find latest check-out for each object_id
    const checkoutsByEmp = new Map<string, any[]>();
    for (const evt of checkoutEvents) {
      const empId = evt.object_id;
      if (!checkoutsByEmp.has(empId)) {
        checkoutsByEmp.set(empId, []);
      }
      checkoutsByEmp.get(empId)!.push(evt);
    }

    for (const [empId, evts] of checkoutsByEmp.entries()) {
      evts.sort((a, b) => new Date(b.time_created).getTime() - new Date(a.time_created).getTime());
      const latest = evts[0];
      
      let item = attendanceMap.get(empId);
      if (!item) {
        item = {
          employeeId: empId,
          thoiGianVao: null,
          thoiGianRa: null,
          entryEvent: null,
          exitEvent: latest,
        };
        attendanceMap.set(empId, item);
      } else {
        item.thoiGianRa = latest.time_created ? extractLocalTimeStr(latest.time_created) : null;
        item.exitEvent = latest;
      }
    }

    const attendance = Array.from(attendanceMap.values());
    ========================================== */

    // THUẬT TOÁN TINH CHỈNH MỚI
    const getActualDateTime = (date: Date, timeStr: string): Date => {
      const [h, m] = timeStr.split(':').map(Number);
      const res = new Date(date);
      res.setHours(h, m, 0, 0);
      return res;
    };

    const actualStart = getActualDateTime(meeting.date_organize, meeting.time_start);
    const actualEnd = getActualDateTime(meeting.date_organize, meeting.time_end);
    const tStartMs = actualStart.getTime();
    const tEndMs = actualEnd.getTime();

    const extractLocalTimeStr = (dateVal: Date | string): string | null => {
      const formatted = this.formatDateToLocalString(dateVal);
      if (!formatted) return null;
      return formatted.split('-')[1] || null;
    };

    const allEmployeeIds = new Set<string>();
    for (const e of checkinEvents) allEmployeeIds.add(e.object_id);
    for (const e of checkoutEvents) allEmployeeIds.add(e.object_id);

    const attendance: any[] = [];

    for (const empId of allEmployeeIds) {
      const empCheckin = checkinEvents.filter(e => e.object_id === empId).map(e => ({ ...e, type: 'in' as const }));
      const empCheckout = checkoutEvents.filter(e => e.object_id === empId).map(e => ({ ...e, type: 'out' as const }));

      const allEmpEvents = [...empCheckin, ...empCheckout].sort(
        (a, b) => new Date(a.time_created).getTime() - new Date(b.time_created).getTime()
      );

      // 1. Xác định giờ vào (entryEvent)
      const nearestBeforeStart = allEmpEvents.filter(e => new Date(e.time_created).getTime() < tStartMs).pop();
      let entryEvent: any = null;

      if (nearestBeforeStart) {
        if (nearestBeforeStart.type === 'out') {
          const firstInDuringMeeting = allEmpEvents.find(
            e => new Date(e.time_created).getTime() >= tStartMs && 
                 new Date(e.time_created).getTime() <= tEndMs && 
                 e.type === 'in'
          );
          entryEvent = firstInDuringMeeting || null;
        } else {
          entryEvent = nearestBeforeStart;
        }
      } else {
        const firstInDuringMeeting = allEmpEvents.find(
          e => new Date(e.time_created).getTime() >= tStartMs && 
               new Date(e.time_created).getTime() <= tEndMs && 
               e.type === 'in'
        );
        entryEvent = firstInDuringMeeting || null;
      }

      // 2. Xác định giờ ra (exitEvent)
      const nearestBeforeEnd = allEmpEvents.filter(
        e => new Date(e.time_created).getTime() >= tStartMs && 
             new Date(e.time_created).getTime() <= tEndMs
      ).pop();
      let exitEvent: any = null;

      if (nearestBeforeEnd) {
        if (nearestBeforeEnd.type === 'out') {
          exitEvent = nearestBeforeEnd;
        } else {
          const firstOutAfterEnd = allEmpEvents.find(
            e => new Date(e.time_created).getTime() > tEndMs && 
                 e.type === 'out'
          );
          exitEvent = firstOutAfterEnd || null;
        }
      } else {
        const firstOutAfterEnd = allEmpEvents.find(
          e => new Date(e.time_created).getTime() > tEndMs && 
               e.type === 'out'
        );
        exitEvent = firstOutAfterEnd || null;
      }

      attendance.push({
        employeeId: empId,
        thoiGianVao: entryEvent && entryEvent.time_created ? extractLocalTimeStr(entryEvent.time_created) : null,
        thoiGianRa: exitEvent && exitEvent.time_created ? extractLocalTimeStr(exitEvent.time_created) : null,
        entryEvent,
        exitEvent,
      });
    }


    return {
      attendance,
      query,
      paramsCheckin: { startTime, endTime, checkinCameraIds, group_ids: meeting.group_ids },
      paramsCheckout: { startTime, endTime, checkoutCameraIds, group_ids: meeting.group_ids }
    };
  }


  // ──────────────────────────────────────────────
  // Shared helpers: list-map & camera→location map
  // ──────────────────────────────────────────────
  private async buildLookupMaps() {
    const lists = await this.lcms.human_list.findMany({
      where: { is_deleted: { not: true } },
      select: { id: true, name: true }
    });
    const listMap = new Map<string, string>(lists.map(l => [l.id, l.name]));

    const binds = await this.cms.location_camera_bind.findMany({ include: { location: true } });
    const locationNameByCameraId = new Map<string, string>();
    for (const bind of binds) {
      if (bind.camera_id && bind.location) {
        locationNameByCameraId.set(bind.camera_id, bind.location.name);
      }
    }
    return { listMap, locationNameByCameraId };
  }

  private buildEventConditions(
    opts: {
      search?: string; zone?: string; startDate?: string;
      endDate?: string; startTime?: string; endTime?: string;
      group?: string;
    },
    cameraIds?: string[]
  ): string {
    const parts: string[] = [
      `ev.is_valid = true`,
      `ev.is_deleted = false`,
    ];
    if (opts.startDate) {
      const t = opts.startTime ? `${opts.startDate} ${opts.startTime}:00` : `${opts.startDate} 00:00:00`;
      parts.push(`ev.create_time >= (TIMESTAMP '${t}')`);
    }
    if (opts.endDate) {
      const t = opts.endTime ? `${opts.endDate} ${opts.endTime}:59` : `${opts.endDate} 23:59:59`;
      parts.push(`ev.create_time <= (TIMESTAMP '${t}')`);
    }
    if (opts.search) {
      const s = opts.search.replace(/'/g, "''");
      parts.push(`(h.full_name ILIKE '%${s}%' OR h.document_id ILIKE '%${s}%')`);
    }
    if (opts.zone && opts.zone !== 'All') {
      const z = opts.zone.replace(/'/g, "''");
      parts.push(`(ca.area_name ILIKE '%${z}%')`);
    } else {
      parts.push(`(ca.area_name ILIKE '%diem danh%' OR ca.area_name ILIKE '%điểm danh%')`);
    }
    if (opts.group && opts.group !== 'All') {
      const g = opts.group.replace(/'/g, "''");
      parts.push(`('${g}' = ANY(h.list_ids))`);
    }
    if (cameraIds) {
      if (cameraIds.length > 0) {
        const list = cameraIds.map(id => `'${id.replace(/'/g, "''")}'`).join(', ');
        parts.push(`es.camera_event_id IN (${list})`);
      } else {
        parts.push(`1 = 0`);
      }
    }
    return parts.join(' AND ');
  }

  private formatDateToLocalString(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const hour = String(d.getUTCHours()).padStart(2, '0');
    const minute = String(d.getUTCMinutes()).padStart(2, '0');
    const second = String(d.getUTCSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}-${hour}:${minute}:${second}`;
  }

  private mapRawEvent(e: any, index: number, listMap: Map<string, string>, locationNameByCameraId: Map<string, string>, pageOffset = 0) {
    let faceImgBase64: string | null = null;
    if (e.cropped_face_images) {
      const buffers = e.cropped_face_images;
      if (Array.isArray(buffers) && buffers.length > 0) {
        const buf = buffers[0];
        if (buf) {
          const rawBuf = Buffer.isBuffer(buf) ? buf : (buf.data ? Buffer.from(buf.data) : null);
          if (rawBuf) faceImgBase64 = `data:image/jpeg;base64,${rawBuf.toString('base64')}`;
        }
      } else if (Buffer.isBuffer(buffers)) {
        faceImgBase64 = `data:image/jpeg;base64,${buffers.toString('base64')}`;
      }
    }

    const thoiGianStr = this.formatDateToLocalString(e.time_created);

    const pb = (e.list_ids || []).map((lid: string) => listMap.get(lid) || lid);
    const groupStr = pb.join(', ') || 'Mặc định';
    const areaName = e.camera_event_id ? locationNameByCameraId.get(e.camera_event_id) : undefined;
    const displayArea = areaName || e.area_name || 'Không xác định';

    return {
      stt: pageOffset + index + 1,
      id: e.event_id,
      vung: displayArea,
      camera_id: e.camera_event_id,
      ten: e.full_name || 'Không tên',
      ma: e.document_id || e.object_id || '',
      danhSach: groupStr,
      thoiGian: thoiGianStr,
      avatarSeed: '',
      faceImgBase64,
      face_image_path: e.face_image_path,
      full_image_path: e.full_image_path,
      accuracy: 95.0
    };
  }

  async getEventLogs(opts: {
    page?: number; limit?: number; search?: string; zone?: string;
    startDate?: string; endDate?: string; startTime?: string; endTime?: string;
    group?: string; eventType?: string;
    noImages?: boolean;
  } = {}) {
    console.log(`[DEBUG Backend] Bắt đầu truy vấn getEventLogs với các tham số:`, opts);
    const page   = Math.max(1, opts.page   || 1);
    const parsedLimit = opts.limit !== undefined ? Number(opts.limit) : 10;
    const limit  = parsedLimit === -1 ? 1000000 : Math.min(500, Math.max(1, parsedLimit));
    const offset = parsedLimit === -1 ? 0 : (page - 1) * limit;

    const { listMap, locationNameByCameraId } = await this.buildLookupMaps();

    let cameraIds: string[] | undefined = undefined;
    if (opts.eventType && opts.eventType !== 'All') {
      const binds = await this.cms.location_camera_bind.findMany({
        select: { camera_id: true, role: true }
      });
      cameraIds = binds
        .filter(b => b.role.includes(opts.eventType === 'in' ? 'checkin' : 'checkout'))
        .map(b => b.camera_id)
        .filter(Boolean);
    }

    const where = this.buildEventConditions(opts, cameraIds);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM event_vms_parent ev
      INNER JOIN event_statistic_parent es ON ev.source_id = es.id
      INNER JOIN human_info h             ON es.object_id = h.id
      LEFT  JOIN camera_area_event_source ca ON es.source_id = ca.area_id
      WHERE ${where};
    `;
    const dataQuery = `
      SELECT
          ev.id AS event_id,
          es.object_id,
          es.camera_event_id,
          ev.create_time AS time_created,
          h.full_name,
          h.document_id,
          h.list_ids,
          ca.camera_friendly_name AS camera_name,
          ca.area_name
          ${opts.noImages ? '' : `, h.cropped_face_images, ei_full.image_path AS full_image_path, ei_face.image_path AS face_image_path`}
      FROM event_vms_parent ev
      INNER JOIN event_statistic_parent es ON ev.source_id = es.id
      INNER JOIN human_info h             ON es.object_id = h.id
      LEFT  JOIN camera_area_event_source ca ON es.source_id = ca.area_id
      ${opts.noImages ? '' : `
      LEFT  JOIN event_image_parent ei_full  ON ev.source_id = ei_full.statistic_id AND ei_full.type = 1
      LEFT  JOIN event_image_parent ei_face  ON ev.source_id = ei_face.statistic_id AND ei_face.type = 4
      `}
      WHERE ${where}
      ORDER BY ev.create_time DESC
      ${parsedLimit === -1 ? '' : `LIMIT ${limit} OFFSET ${offset}`};
    `;

    try {
      const [countRows, rawEvents] = await Promise.all([
        this.lcms.$queryRawUnsafe<any[]>(countQuery),
        this.lcms.$queryRawUnsafe<any[]>(dataQuery),
      ]);
      console.log(`[DEBUG Backend] Thực thi SQL thành công. Số lượng bản ghi thô (raw): ${rawEvents.length}`);

      const total = parseInt(countRows[0]?.total ?? '0', 10);
      const data  = rawEvents.map((e, idx) => this.mapRawEvent(e, idx, listMap, locationNameByCameraId, offset));
      console.log(`[DEBUG Backend] Map dữ liệu thành công. Tổng số bản ghi (total): ${total}, Số bản ghi trả về trang này: ${data.length}`);

      return { data, total, page, limit };
    } catch (error: any) {
      console.error(`[DEBUG Backend] LỖI khi thực thi truy vấn SQL getEventLogs:`, error.message || error);
      throw error;
    }
  }

  async getEventLogIds(opts: {
    page?: number; limit?: number; search?: string; zone?: string;
    startDate?: string; endDate?: string; startTime?: string; endTime?: string;
    group?: string; eventType?: string;
  } = {}) {
    const page   = Math.max(1, opts.page   || 1);
    const limit  = Math.min(500, Math.max(1, opts.limit || 10));
    const offset = (page - 1) * limit;

    let cameraIds: string[] | undefined = undefined;
    if (opts.eventType && opts.eventType !== 'All') {
      const binds = await this.cms.location_camera_bind.findMany({
        select: { camera_id: true, role: true }
      });
      cameraIds = binds
        .filter(b => b.role.includes(opts.eventType === 'in' ? 'checkin' : 'checkout'))
        .map(b => b.camera_id)
        .filter(Boolean);
    }

    const where = this.buildEventConditions(opts, cameraIds);
    const query = `
      SELECT ev.id AS event_id
      FROM event_vms_parent ev
      INNER JOIN event_statistic_parent es ON ev.source_id = es.id
      INNER JOIN human_info h             ON es.object_id = h.id
      LEFT  JOIN camera_area_event_source ca ON es.source_id = ca.area_id
      WHERE ${where}
      ORDER BY ev.create_time DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    const rows = await this.lcms.$queryRawUnsafe<any[]>(query);
    return rows.map(r => r.event_id);
  }

  async exportExcel(data: any[], res: any) {
    if (!Array.isArray(data)) {
      data = [];
    }

    const formattedRows = data.map((item) => ({
      'STT': item.stt,
      'Khu vực': item.vung || '',
      'Họ và tên': item.ten || '',
      'Mã nhân viên': item.ma || '',
      'Phòng ban/Danh sách': item.danhSach || '',
      'Thời gian': item.thoiGian || '',
      'Độ chính xác (%)': item.accuracy || 95.0
    }));

    const ws = XLSX.utils.json_to_sheet(formattedRows);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:G100');
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: range.e.r, c: range.e.c }
      })
    };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachSuKien');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="DanhSachSuKien.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  }

  async getDailyAttendanceReport(
    dateStr: string,
    areaNames: string[],
    groupId: string,
    customShiftStart?: string,
    customShiftEnd?: string,
    customBufferHours?: number,
  ) {
    const shiftStart = customShiftStart || process.env.SHIFT_START_TIME || '07:30';
    const shiftEnd = customShiftEnd || process.env.SHIFT_END_TIME || '17:00';
    const shiftBufferHours = customBufferHours !== undefined && !Number.isNaN(customBufferHours)
      ? customBufferHours
      : parseInt(process.env.SHIFT_BUFFER_HOURS || '2', 10);

    const getOffsetTimeStr = (timeStr: string, offsetHours: number): string => {
      const [h, m] = timeStr.split(':').map(Number);
      let totalMinutes = h * 60 + (m || 0) + offsetHours * 60;
      if (totalMinutes < 0) totalMinutes = 0;
      if (totalMinutes >= 24 * 60) totalMinutes = 24 * 60 - 1;
      
      const newH = Math.floor(totalMinutes / 60);
      const newM = totalMinutes % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(newH)}:${pad(newM)}:00`;
    };

    const startTimeStr = getOffsetTimeStr(shiftStart, -shiftBufferHours);
    const endTimeStr = getOffsetTimeStr(shiftEnd, shiftBufferHours);

    const startTime = `${dateStr} ${startTimeStr}`;
    const endTime = `${dateStr} ${endTimeStr}`;

    // 1. Fetch location ids matching selected areas
    const locations = await this.cms.location.findMany({
      where: { name: { in: areaNames } }
    });
    const locationIds = locations.map(loc => loc.id);

    // 2. Fetch location camera binds
    const binds = await this.cms.location_camera_bind.findMany({
      where: { location_id: { in: locationIds } },
    });

    const checkinCameraIds = binds
      .filter(b => b.role.includes('checkin') || b.role.length === 0)
      .map(b => b.camera_id)
      .filter(Boolean);
    const checkoutCameraIds = binds
      .filter(b => b.role.includes('checkout') || b.role.length === 0)
      .map(b => b.camera_id)
      .filter(Boolean);

    if (binds.length === 0) {
      return { attendance: [] };
    }

    // 3. Prepare parameters and query SQL
    const queryArgs: any[] = [startTime, endTime, checkinCameraIds];
    let groupFilterSql = '';
    if (groupId && groupId !== 'All') {
      groupFilterSql = `AND h.list_ids && $4::varchar[]`;
      queryArgs.push([groupId]);
    }

    const query = `
      SELECT 
          es.object_id,
          ev.create_time AS time_created,
          h.full_name,
          h.document_id,
          h.cropped_face_images,
          ca.camera_friendly_name AS camera_name,
          ca.area_name,
          ei_full.image_path AS full_image_path,
          ei_face.image_path AS face_image_path
      FROM event_vms_parent ev
      INNER JOIN event_statistic_parent es 
          ON ev.source_id = es.id
      INNER JOIN human_info h 
          ON es.object_id = h.id
      LEFT JOIN camera_area_event_source ca 
          ON es.source_id = ca.area_id
      LEFT JOIN event_image_parent ei_full
          ON ev.source_id = ei_full.statistic_id AND ei_full.type = 1
      LEFT JOIN event_image_parent ei_face
          ON ev.source_id = ei_face.statistic_id AND ei_face.type = 4
      WHERE 
          ev.create_time >= $1::timestamp 
          AND ev.create_time <= $2::timestamp
          AND es.camera_event_id = ANY($3::varchar[])
          ${groupFilterSql}
          AND (ca.area_name ILIKE '%diem danh%' OR ca.area_name ILIKE '%điểm danh%')
          AND ev.is_valid = true 
          AND ev.is_deleted = false
      ORDER BY ev.create_time ASC;
    `;

    const mapEvent = (e: any) => {
      let faceImgBase64: string | null = null;
      if (e.cropped_face_images) {
        const buffers = e.cropped_face_images;
        if (Array.isArray(buffers) && buffers.length > 0) {
          const buf = buffers[0];
          if (buf) {
            const rawBuf = Buffer.isBuffer(buf) ? buf : (buf.data ? Buffer.from(buf.data) : null);
            if (rawBuf) {
              faceImgBase64 = `data:image/jpeg;base64,${rawBuf.toString('base64')}`;
            }
          }
        } else if (Buffer.isBuffer(buffers)) {
          faceImgBase64 = `data:image/jpeg;base64,${buffers.toString('base64')}`;
        }
      }
      return {
        ...e,
        cropped_face_images: faceImgBase64 ? [faceImgBase64] : []
      };
    };

    // Parallel execution for check-in and check-out
    const checkinQuery = checkinCameraIds.length > 0
      ? this.lcms.$queryRawUnsafe<any[]>(query, ...queryArgs)
      : Promise.resolve([]);

    const checkoutArgs = [...queryArgs];
    checkoutArgs[2] = checkoutCameraIds;
    const checkoutQuery = checkoutCameraIds.length > 0
      ? this.lcms.$queryRawUnsafe<any[]>(query, ...checkoutArgs)
      : Promise.resolve([]);

    const [checkinEventsRaw, checkoutEventsRaw] = await Promise.all([
      checkinQuery,
      checkoutQuery,
    ]);

    const checkinEvents = checkinEventsRaw.map(mapEvent);
    const checkoutEvents = checkoutEventsRaw.map(mapEvent);

    // Use UTC-based boundary comparison because DB stores UTC timestamps
    // e.g. dateStr = '2026-07-17', shiftStart = '07:30' => treat as UTC+7 local
    // Convert to UTC: 07:30 ICT = 00:30 UTC
    const TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7
    const parseLocalToUTCMs = (dateStr: string, timeStr: string): number => {
      const dt = new Date(`${dateStr}T${timeStr}:00`);
      return dt.getTime() - TZ_OFFSET_MS;
    };

    const tStartMs = parseLocalToUTCMs(dateStr, shiftStart);
    const tEndMs = parseLocalToUTCMs(dateStr, shiftEnd);

    const extractLocalTimeStr = (dateVal: Date | string): string | null => {
      const formatted = this.formatDateToLocalString(dateVal);
      if (!formatted) return null;
      return formatted.split('-')[1] || null;
    };

    const allEmployeeIds = new Set<string>();
    for (const e of checkinEvents) allEmployeeIds.add(e.object_id);
    for (const e of checkoutEvents) allEmployeeIds.add(e.object_id);

    const attendance: any[] = [];

    for (const empId of allEmployeeIds) {
      const empCheckin = checkinEvents.filter(e => e.object_id === empId).map(e => ({ ...e, type: 'in' as const }));
      const empCheckout = checkoutEvents.filter(e => e.object_id === empId).map(e => ({ ...e, type: 'out' as const }));

      const allEmpEvents = [...empCheckin, ...empCheckout].sort(
        (a, b) => new Date(a.time_created).getTime() - new Date(b.time_created).getTime()
      );

      // Entry Event logic
      const nearestBeforeStart = allEmpEvents.filter(e => new Date(e.time_created).getTime() < tStartMs).pop();
      let entryEvent: any = null;
      if (nearestBeforeStart) {
        if (nearestBeforeStart.type === 'out') {
          const firstInDuringMeeting = allEmpEvents.find(
            e => new Date(e.time_created).getTime() >= tStartMs && 
                 new Date(e.time_created).getTime() <= tEndMs && 
                 e.type === 'in'
          );
          entryEvent = firstInDuringMeeting || null;
        } else {
          entryEvent = nearestBeforeStart;
        }
      } else {
        const firstInDuringMeeting = allEmpEvents.find(
          e => new Date(e.time_created).getTime() >= tStartMs && 
               new Date(e.time_created).getTime() <= tEndMs && 
               e.type === 'in'
        );
        entryEvent = firstInDuringMeeting || null;
      }

      // Exit Event logic
      const nearestBeforeEnd = allEmpEvents.filter(
        e => new Date(e.time_created).getTime() >= tStartMs && 
             new Date(e.time_created).getTime() <= tEndMs
      ).pop();
      let exitEvent: any = null;
      if (nearestBeforeEnd) {
        if (nearestBeforeEnd.type === 'out') {
          exitEvent = nearestBeforeEnd;
        } else {
          const firstOutAfterEnd = allEmpEvents.find(
            e => new Date(e.time_created).getTime() > tEndMs && 
                 e.type === 'out'
          );
          exitEvent = firstOutAfterEnd || null;
        }
      } else {
        const firstOutAfterEnd = allEmpEvents.find(
          e => new Date(e.time_created).getTime() > tEndMs && 
               e.type === 'out'
        );
        exitEvent = firstOutAfterEnd || null;
      }

      const empName = empCheckin[0]?.full_name || empCheckout[0]?.full_name || '';
      const empDocId = empCheckin[0]?.document_id || empCheckout[0]?.document_id || '';

      attendance.push({
        employeeId: empId,
        employeeName: empName,
        documentId: empDocId,
        thoiGianVao: entryEvent && entryEvent.time_created ? extractLocalTimeStr(entryEvent.time_created) : null,
        thoiGianRa: exitEvent && exitEvent.time_created ? extractLocalTimeStr(exitEvent.time_created) : null,
        entryEvent,
        exitEvent,
      });
    }

    return { attendance };
  }

  /**
   * Lấy báo cáo điểm danh theo khoảng thời gian (tuần / tháng).
   * Trả về mảng nhân sự, mỗi nhân sự có:
   *   - dailyLogs: mỗi ngày có thoiGianVao/Ra + entryEvent/exitEvent
   *   - totalHours: tổng giờ công tích lũy cả khoảng
   */
  async getRangeAttendanceReport(startDateStr: string, endDateStr: string, areaNames: string[], groupId: string) {
    const shiftStart = process.env.SHIFT_START_TIME || '07:30';
    const shiftEnd = process.env.SHIFT_END_TIME || '17:00';
    const shiftBufferHours = parseInt(process.env.SHIFT_BUFFER_HOURS || '2', 10);

    const getOffsetTimeStr = (timeStr: string, offsetHours: number): string => {
      const [h, m] = timeStr.split(':').map(Number);
      let totalMinutes = h * 60 + (m || 0) + offsetHours * 60;
      if (totalMinutes < 0) totalMinutes = 0;
      if (totalMinutes >= 24 * 60) totalMinutes = 24 * 60 - 1;
      const newH = Math.floor(totalMinutes / 60);
      const newM = totalMinutes % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(newH)}:${pad(newM)}:00`;
    };

    const startTimeOfDay = getOffsetTimeStr(shiftStart, -shiftBufferHours);
    const endTimeOfDay = getOffsetTimeStr(shiftEnd, shiftBufferHours);

    const queryStart = `${startDateStr} ${startTimeOfDay}`;
    const queryEnd = `${endDateStr} ${endTimeOfDay}`;

    // 1. Fetch location binds
    const locations = await this.cms.location.findMany({
      where: areaNames.length > 0 ? { name: { in: areaNames } } : {},
    });
    const locationIds = locations.map(loc => loc.id);
    const binds = locationIds.length > 0
      ? await this.cms.location_camera_bind.findMany({ where: { location_id: { in: locationIds } } })
      : await this.cms.location_camera_bind.findMany();

    const allCameraIds = binds.map(b => b.camera_id).filter(Boolean);
    if (allCameraIds.length === 0) return { attendance: [] };

    const checkinCameraIds = binds.filter(b => b.role.includes('checkin') || b.role.length === 0).map(b => b.camera_id).filter(Boolean);
    const checkoutCameraIds = binds.filter(b => b.role.includes('checkout') || b.role.length === 0).map(b => b.camera_id).filter(Boolean);

    // 2. Build SQL with optional group filter
    let groupFilterSql = '';
    const baseArgs: any[] = [queryStart, queryEnd, checkinCameraIds];
    if (groupId && groupId !== 'All') {
      groupFilterSql = `AND h.list_ids && $4::varchar[]`;
      baseArgs.push([groupId]);
    }

    const sql = `
      SELECT
          es.object_id,
          ev.create_time AS time_created,
          h.full_name,
          h.cropped_face_images,
          es.camera_event_id,
          ei_face.image_path AS face_image_path
      FROM event_vms_parent ev
      INNER JOIN event_statistic_parent es ON ev.source_id = es.id
      INNER JOIN human_info h ON es.object_id = h.id
      LEFT JOIN camera_area_event_source ca ON es.source_id = ca.area_id
      LEFT JOIN event_image_parent ei_face ON ev.source_id = ei_face.statistic_id AND ei_face.type = 4
      WHERE
          ev.create_time >= $1::timestamp
          AND ev.create_time <= $2::timestamp
          AND es.camera_event_id = ANY($3::varchar[])
          ${groupFilterSql}
          AND (ca.area_name ILIKE '%diem danh%' OR ca.area_name ILIKE '%điểm danh%')
          AND ev.is_valid = true
          AND ev.is_deleted = false
      ORDER BY ev.create_time ASC;
    `;

    const checkoutArgs = [...baseArgs];
    checkoutArgs[2] = checkoutCameraIds;

    const [checkinRaw, checkoutRaw] = await Promise.all([
      checkinCameraIds.length > 0 ? this.lcms.$queryRawUnsafe<any[]>(sql, ...baseArgs) : Promise.resolve([]),
      checkoutCameraIds.length > 0 ? this.lcms.$queryRawUnsafe<any[]>(sql, ...checkoutArgs) : Promise.resolve([]),
    ]);

    const mapEv = (e: any) => {
      let face: string | null = null;
      const buf = e.cropped_face_images;
      if (buf) {
        const raw = Buffer.isBuffer(buf) ? buf : (buf.data ? Buffer.from(buf.data) : null);
        if (raw) face = `data:image/jpeg;base64,${raw.toString('base64')}`;
      }
      return { ...e, cropped_face_images: face ? [face] : [] };
    };

    const checkinEvents: any[] = checkinRaw.map(mapEv);
    const checkoutEvents: any[] = checkoutRaw.map(mapEv);

    // 3. Helper: for a given empId + dateStr, find entryEvent (first in) and exitEvent (last out)
    const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
    const parseLocalToUTCMs = (ds: string, ts: string) => new Date(`${ds}T${ts}:00`).getTime() - TZ_OFFSET_MS;

    const calcWorkHours = (inStr: string | null, outStr: string | null): number => {
      if (!inStr || !outStr) return 0;
      const [ih, im, is_] = inStr.split(':').map(Number);
      const [oh, om, os] = outStr.split(':').map(Number);
      const inSec = ih * 3600 + (im || 0) * 60 + (is_ || 0);
      const outSec = oh * 3600 + (om || 0) * 60 + (os || 0);
      if (outSec <= inSec) return 0;
      let diff = outSec - inSec - 5400; // minus 1.5h lunch
      diff = Math.max(0, diff);
      return Math.min(8, diff / 3600);
    };

    // 4. Enumerate all dates in range
    const allDates: string[] = [];
    const cur = new Date(startDateStr);
    const end = new Date(endDateStr);
    while (cur <= end) {
      allDates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    // 5. Collect all employee IDs from events
    const allEmpIds = new Set<string>();
    for (const e of checkinEvents) allEmpIds.add(e.object_id);
    for (const e of checkoutEvents) allEmpIds.add(e.object_id);

    const attendance: any[] = [];

    for (const empId of allEmpIds) {
      const empIn = checkinEvents.filter(e => e.object_id === empId);
      const empOut = checkoutEvents.filter(e => e.object_id === empId);
      const empName = empIn[0]?.full_name || empOut[0]?.full_name || '';

      let totalHours = 0;
      const dailyLogs: any[] = [];

      for (const ds of allDates) {
        const tStartMs = parseLocalToUTCMs(ds, shiftStart);
        const tEndMs = parseLocalToUTCMs(ds, shiftEnd);

        const dayIn = empIn.filter(e => {
          const t = new Date(e.time_created).getTime();
          return t >= tStartMs - shiftBufferHours * 3600000 && t <= tEndMs + shiftBufferHours * 3600000;
        }).sort((a, b) => new Date(a.time_created).getTime() - new Date(b.time_created).getTime());

        const dayOut = empOut.filter(e => {
          const t = new Date(e.time_created).getTime();
          return t >= tStartMs - shiftBufferHours * 3600000 && t <= tEndMs + shiftBufferHours * 3600000;
        }).sort((a, b) => new Date(b.time_created).getTime() - new Date(a.time_created).getTime());

        const entryEvent = dayIn[0] || null;
        const exitEvent = dayOut[0] || null;

        const inStr = entryEvent ? this.formatDateToLocalString(entryEvent.time_created).split('-')[1] : null;
        const outStr = exitEvent ? this.formatDateToLocalString(exitEvent.time_created).split('-')[1] : null;
        const hours = calcWorkHours(inStr, outStr);
        totalHours += hours;

        dailyLogs.push({
          date: ds,
          thoiGianVao: inStr,
          thoiGianRa: outStr,
          hours,
          entryEvent,
          exitEvent,
        });
      }

      attendance.push({
        employeeId: empId,
        employeeName: empName,
        totalHours: Math.min(totalHours, allDates.length * 8),
        dailyLogs,
      });
    }

    return { attendance };
  }
}
