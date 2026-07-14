
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/edge.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.Camera_cfgScalarFieldEnum = {
  id: 'id',
  name: 'name',
  search_tag: 'search_tag',
  cfg_data: 'cfg_data',
  user_id_owner: 'user_id_owner',
  time_created: 'time_created',
  time_modified: 'time_modified'
};

exports.Prisma.Camera_storage_totalScalarFieldEnum = {
  partition_path: 'partition_path',
  camera_id: 'camera_id',
  use_disk_mb: 'use_disk_mb',
  time_start: 'time_start',
  time_end: 'time_end',
  total_dur: 'total_dur',
  lost_dur: 'lost_dur'
};

exports.Prisma.Channel_cfgScalarFieldEnum = {
  id: 'id',
  name: 'name',
  camera_mapping_id: 'camera_mapping_id',
  search_tag: 'search_tag',
  cfg_data: 'cfg_data',
  user_id_owner: 'user_id_owner',
  time_created: 'time_created',
  time_modified: 'time_modified'
};

exports.Prisma.Device_owner_cfgScalarFieldEnum = {
  id: 'id',
  name: 'name',
  time_created: 'time_created',
  time_modified: 'time_modified'
};

exports.Prisma.Event_vms_sync_parentScalarFieldEnum = {
  id: 'id',
  lcms_server_id: 'lcms_server_id',
  event_vms_id: 'event_vms_id',
  source_id: 'source_id',
  event_time: 'event_time',
  data_file_path: 'data_file_path',
  partition_key: 'partition_key'
};

exports.Prisma.Event_vms_sync_update_parentScalarFieldEnum = {
  index: 'index',
  update_table_type: 'update_table_type',
  lcms_server_id: 'lcms_server_id',
  event_id: 'event_id',
  data_file_path: 'data_file_path',
  partition_key: 'partition_key'
};

exports.Prisma.Face_index_sync_parentScalarFieldEnum = {
  id: 'id',
  lcms_server_id: 'lcms_server_id',
  face_index_id: 'face_index_id',
  event_time: 'event_time',
  data_file_path: 'data_file_path',
  partition_key: 'partition_key'
};

exports.Prisma.Human_infoScalarFieldEnum = {
  id: 'id',
  lcms_server_id: 'lcms_server_id',
  document_id: 'document_id',
  id_type: 'id_type',
  release_date: 'release_date',
  issued_by: 'issued_by',
  full_name: 'full_name',
  gender: 'gender',
  birthday: 'birthday',
  phone_number: 'phone_number',
  email: 'email',
  address: 'address',
  note: 'note',
  company: 'company',
  list_ids: 'list_ids',
  is_deleted: 'is_deleted',
  avatars: 'avatars',
  id_scan_images: 'id_scan_images',
  other_images: 'other_images',
  root_face_images: 'root_face_images',
  cropped_face_images: 'cropped_face_images',
  face_features: 'face_features',
  time_created: 'time_created',
  time_modified: 'time_modified',
  height: 'height',
  weight: 'weight',
  certificates_json_text: 'certificates_json_text'
};

exports.Prisma.Human_listScalarFieldEnum = {
  id: 'id',
  lcms_server_id: 'lcms_server_id',
  name: 'name',
  is_deleted: 'is_deleted',
  time_created: 'time_created',
  time_modified: 'time_modified'
};

exports.Prisma.Monitoring_slot_summary_sync_parentScalarFieldEnum = {
  id: 'id',
  lcms_server_id: 'lcms_server_id',
  slot_summary_id: 'slot_summary_id',
  event_time: 'event_time',
  data_file_path: 'data_file_path',
  partition_key: 'partition_key'
};

exports.Prisma.Nvr_cfgScalarFieldEnum = {
  id: 'id',
  name: 'name',
  search_tag: 'search_tag',
  cfg_data: 'cfg_data',
  user_id_owner: 'user_id_owner',
  time_created: 'time_created',
  time_modified: 'time_modified'
};

exports.Prisma.Nvr_channel_cfgScalarFieldEnum = {
  id: 'id',
  nvr_id: 'nvr_id',
  nvr_channel_index: 'nvr_channel_index',
  name: 'name',
  search_tag: 'search_tag',
  cfg_data: 'cfg_data',
  user_id_owner: 'user_id_owner',
  time_created: 'time_created',
  time_modified: 'time_modified'
};

exports.Prisma.Vehicle_infoScalarFieldEnum = {
  id: 'id',
  lcms_server_id: 'lcms_server_id',
  license_plate: 'license_plate',
  name: 'name',
  type: 'type',
  manufacturer: 'manufacturer',
  color: 'color',
  color_license_plate: 'color_license_plate',
  images: 'images',
  vehicle_payload: 'vehicle_payload',
  note: 'note',
  list_ids: 'list_ids',
  is_deleted: 'is_deleted',
  time_created: 'time_created',
  time_modified: 'time_modified',
  card_code: 'card_code'
};

exports.Prisma.Vehicle_listScalarFieldEnum = {
  id: 'id',
  lcms_server_id: 'lcms_server_id',
  name: 'name',
  is_deleted: 'is_deleted',
  time_created: 'time_created',
  time_modified: 'time_modified'
};

exports.Prisma.Version_controlScalarFieldEnum = {
  id: 'id',
  type: 'type',
  tablename: 'tablename',
  version: 'version',
  timeupdated: 'timeupdated'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  camera_cfg: 'camera_cfg',
  camera_storage_total: 'camera_storage_total',
  channel_cfg: 'channel_cfg',
  device_owner_cfg: 'device_owner_cfg',
  event_vms_sync_parent: 'event_vms_sync_parent',
  event_vms_sync_update_parent: 'event_vms_sync_update_parent',
  face_index_sync_parent: 'face_index_sync_parent',
  human_info: 'human_info',
  human_list: 'human_list',
  monitoring_slot_summary_sync_parent: 'monitoring_slot_summary_sync_parent',
  nvr_cfg: 'nvr_cfg',
  nvr_channel_cfg: 'nvr_channel_cfg',
  vehicle_info: 'vehicle_info',
  vehicle_list: 'vehicle_list',
  version_control: 'version_control'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "D:\\Anta6 Documents\\LCMS Anh Cường\\Source\\cms_faceid_cms\\apps\\backend\\generated\\dvms",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      },
      {
        "fromEnvVar": null,
        "value": "linux-musl-openssl-3.0.x"
      }
    ],
    "previewFeatures": [],
    "sourceFilePath": "D:\\Anta6 Documents\\LCMS Anh Cường\\Source\\cms_faceid_cms\\apps\\backend\\prisma\\dvms.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../.env"
  },
  "relativePath": "../../prisma",
  "clientVersion": "5.22.0",
  "engineVersion": "605197351a3c8bdd595af2d2a9bc3025bca48ea2",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DVMS_DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider      = \"prisma-client-js\"\n  output        = \"../generated/dvms\"\n  binaryTargets = [\"native\", \"linux-musl-openssl-3.0.x\"]\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DVMS_DATABASE_URL\")\n}\n\nmodel camera_cfg {\n  id            String    @id @db.VarChar(40)\n  name          String?   @db.VarChar(64)\n  search_tag    String?   @db.VarChar(256)\n  cfg_data      Bytes?\n  user_id_owner String?   @db.VarChar(40)\n  time_created  DateTime? @db.Timestamp(6)\n  time_modified DateTime? @db.Timestamp(6)\n\n  @@index([user_id_owner], type: Hash)\n}\n\n/// This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\n/// The underlying table does not contain a valid unique identifier and can therefore currently not be handled by Prisma Client.\n/// This model contains an index with non-default null sort order and requires additional setup for migrations. Visit https://pris.ly/d/default-index-null-ordering for more info.\nmodel camera_storage_hour_parent {\n  id             String    @default(dbgenerated(\"uuid_generate_v1()\")) @db.Uuid\n  partition_path String?   @db.VarChar(8)\n  camera_id      String?   @db.VarChar(40)\n  use_disk_mb    Float?    @db.Real\n  time_start     DateTime? @db.Timestamp(6)\n  time_end       DateTime? @db.Timestamp(6)\n  total_dur      Int?      @db.SmallInt\n  lost_dur       Int?      @db.SmallInt\n  partition_key  Int?\n\n  @@index([camera_id], type: Hash)\n  @@index([id], type: Hash)\n  @@index([time_start(sort: Desc)])\n  @@ignore\n}\n\nmodel camera_storage_total {\n  partition_path String    @db.VarChar(8)\n  camera_id      String    @db.VarChar(40)\n  use_disk_mb    Float?    @db.Real\n  time_start     DateTime? @db.Timestamp(6)\n  time_end       DateTime? @db.Timestamp(6)\n  total_dur      Int?\n  lost_dur       Int?\n\n  @@id([partition_path, camera_id], map: \"camera_storage_total_pk\")\n}\n\nmodel channel_cfg {\n  id                String    @id @db.VarChar(40)\n  name              String?   @db.VarChar(64)\n  camera_mapping_id String?   @db.VarChar(64)\n  search_tag        String?   @db.VarChar(256)\n  cfg_data          Bytes?\n  user_id_owner     String?   @db.VarChar(40)\n  time_created      DateTime? @db.Timestamp(6)\n  time_modified     DateTime? @db.Timestamp(6)\n\n  @@index([camera_mapping_id], type: Hash)\n  @@index([user_id_owner], type: Hash)\n}\n\n/// This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\n/// The underlying table does not contain a valid unique identifier and can therefore currently not be handled by Prisma Client.\nmodel channel_record_parent {\n  id            String    @default(dbgenerated(\"uuid_generate_v1()\")) @db.Uuid\n  date_record   DateTime? @db.Timestamp(6)\n  channel_id    String?   @db.VarChar(40)\n  partition_key Int?\n\n  @@index([channel_id], type: Hash)\n  @@index([id], type: Hash)\n  @@ignore\n}\n\nmodel device_owner_cfg {\n  id            String    @id @db.VarChar(128)\n  name          String?   @db.VarChar(256)\n  time_created  DateTime? @db.Timestamp(6)\n  time_modified DateTime? @db.Timestamp(6)\n}\n\n/// This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\n/// The underlying table does not contain a valid unique identifier and can therefore currently not be handled by Prisma Client.\n/// This model contains an index with non-default null sort order and requires additional setup for migrations. Visit https://pris.ly/d/default-index-null-ordering for more info.\nmodel event_record_parent {\n  id             String    @default(dbgenerated(\"uuid_generate_v1()\")) @db.Uuid\n  time_record_id String?   @db.Uuid\n  type_event     Int?      @db.SmallInt\n  time_start     DateTime? @db.Timestamp(6)\n  time_end       DateTime? @db.Timestamp(6)\n  partition_key  Int?\n\n  @@index([id], type: Hash)\n  @@index([time_record_id], type: Hash)\n  @@index([time_start(sort: Desc)])\n  @@ignore\n}\n\n/// This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\n/// This model contains an index with non-default null sort order and requires additional setup for migrations. Visit https://pris.ly/d/default-index-null-ordering for more info.\nmodel event_vms_sync_parent {\n  id             String    @db.VarChar(40)\n  lcms_server_id String?   @db.VarChar(40)\n  event_vms_id   String?   @db.VarChar(40)\n  source_id      String?   @db.VarChar(40)\n  event_time     DateTime? @db.Timestamp(6)\n  data_file_path String?   @db.VarChar(280)\n  partition_key  Int\n\n  @@id([id, partition_key])\n  @@index([event_time(sort: Desc)])\n  @@index([event_vms_id], type: Hash)\n  @@index([source_id], type: Hash)\n}\n\n/// This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\nmodel event_vms_sync_update_parent {\n  index             BigInt  @default(autoincrement())\n  update_table_type Int?    @db.SmallInt\n  lcms_server_id    String? @db.VarChar(40)\n  event_id          String? @db.VarChar(40)\n  data_file_path    String? @db.VarChar(280)\n  partition_key     Int\n\n  @@id([index, partition_key])\n}\n\n/// This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\n/// This model contains an index with non-default null sort order and requires additional setup for migrations. Visit https://pris.ly/d/default-index-null-ordering for more info.\nmodel face_index_sync_parent {\n  id             String    @db.VarChar(40)\n  lcms_server_id String?   @db.VarChar(40)\n  face_index_id  String?   @db.VarChar(40)\n  event_time     DateTime? @db.Timestamp(6)\n  data_file_path String?   @db.VarChar(280)\n  partition_key  Int\n\n  @@id([id, partition_key])\n  @@index([event_time(sort: Desc)])\n  @@index([face_index_id], type: Hash)\n}\n\n/// This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.\nmodel human_info {\n  id                     String    @id @db.VarChar(40)\n  lcms_server_id         String?   @db.VarChar(40)\n  document_id            String?   @db.VarChar(40)\n  id_type                String?   @db.VarChar(64)\n  release_date           DateTime? @db.Timestamp(6)\n  issued_by              String?   @db.VarChar(255)\n  full_name              String?   @db.VarChar(255)\n  gender                 Int?      @db.SmallInt\n  birthday               DateTime? @db.Timestamp(6)\n  phone_number           String?   @db.VarChar(20)\n  email                  String?   @db.VarChar(100)\n  address                String?   @db.VarChar(255)\n  note                   String?   @db.VarChar\n  company                String?   @db.VarChar(255)\n  list_ids               String[]  @db.VarChar(40)\n  is_deleted             Boolean?  @default(false)\n  avatars                Bytes[]\n  id_scan_images         Bytes[]\n  other_images           Bytes[]\n  root_face_images       Bytes[]\n  cropped_face_images    Bytes[]\n  face_features          Float[]   @db.Real\n  time_created           DateTime? @db.Timestamp(6)\n  time_modified          DateTime? @db.Timestamp(6)\n  height                 Float?\n  weight                 Float?\n  certificates_json_text String?\n\n  @@index([lcms_server_id], type: Hash)\n}\n\n/// This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.\nmodel human_list {\n  id             String    @id @db.VarChar(40)\n  lcms_server_id String?   @db.VarChar(40)\n  name           String?   @db.VarChar(255)\n  is_deleted     Boolean?  @default(false)\n  time_created   DateTime? @db.Timestamp(6)\n  time_modified  DateTime? @db.Timestamp(6)\n}\n\n/// This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\n/// This model contains an index with non-default null sort order and requires additional setup for migrations. Visit https://pris.ly/d/default-index-null-ordering for more info.\nmodel monitoring_slot_summary_sync_parent {\n  id              String    @db.VarChar(40)\n  lcms_server_id  String?   @db.VarChar(40)\n  slot_summary_id String?   @db.VarChar(40)\n  event_time      DateTime? @db.Timestamp(6)\n  data_file_path  String?   @db.VarChar(280)\n  partition_key   Int\n\n  @@id([id, partition_key])\n  @@index([event_time(sort: Desc)])\n  @@index([slot_summary_id], type: Hash)\n}\n\nmodel nvr_cfg {\n  id            String    @id @db.VarChar(40)\n  name          String?   @db.VarChar(64)\n  search_tag    String?   @db.VarChar(256)\n  cfg_data      Bytes?\n  user_id_owner String?   @db.VarChar(40)\n  time_created  DateTime? @db.Timestamp(6)\n  time_modified DateTime? @db.Timestamp(6)\n\n  @@index([user_id_owner], type: Hash)\n}\n\nmodel nvr_channel_cfg {\n  id                String    @id @db.VarChar(40)\n  nvr_id            String?   @db.VarChar(40)\n  nvr_channel_index Int?      @db.SmallInt\n  name              String?   @db.VarChar(64)\n  search_tag        String?   @db.VarChar(256)\n  cfg_data          Bytes?\n  user_id_owner     String?   @db.VarChar(40)\n  time_created      DateTime? @db.Timestamp(6)\n  time_modified     DateTime? @db.Timestamp(6)\n\n  @@index([nvr_id], type: Hash)\n  @@index([user_id_owner], type: Hash)\n}\n\n/// This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\n/// The underlying table does not contain a valid unique identifier and can therefore currently not be handled by Prisma Client.\nmodel time_record_parent {\n  id                String    @default(dbgenerated(\"uuid_generate_v1()\")) @db.Uuid\n  channel_record_id String?   @db.Uuid\n  stream_id         BigInt?\n  camera_id         String?   @db.VarChar(40)\n  mode_record       Int?      @db.SmallInt\n  partition_path    String?   @db.VarChar(8)\n  time_start        DateTime? @db.Timestamp(6)\n  time_end          DateTime? @db.Timestamp(6)\n  average_fps       Float?    @db.Real\n  partition_key     Int?\n\n  @@index([channel_record_id], type: Hash)\n  @@index([id], type: Hash)\n  @@index([time_start])\n  @@ignore\n}\n\n/// This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.\nmodel vehicle_info {\n  id                  String    @id @db.VarChar(40)\n  lcms_server_id      String?   @db.VarChar(40)\n  license_plate       String?   @db.VarChar(40)\n  name                String?   @db.VarChar(255)\n  type                Int?      @db.SmallInt\n  manufacturer        Int?      @db.SmallInt\n  color               Int?      @db.SmallInt\n  color_license_plate Int?      @db.SmallInt\n  images              Bytes[]\n  vehicle_payload     Float?    @db.Real\n  note                String?\n  list_ids            String[]  @db.VarChar(40)\n  is_deleted          Boolean?  @default(false)\n  time_created        DateTime? @db.Timestamp(6)\n  time_modified       DateTime? @db.Timestamp(6)\n  card_code           String?   @unique @db.VarChar(40)\n}\n\n/// This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.\nmodel vehicle_list {\n  id             String    @id @db.VarChar(40)\n  lcms_server_id String?   @db.VarChar(40)\n  name           String?   @db.VarChar(255)\n  is_deleted     Boolean?  @default(false)\n  time_created   DateTime? @db.Timestamp(6)\n  time_modified  DateTime? @db.Timestamp(6)\n}\n\nmodel version_control {\n  id          String    @id @default(dbgenerated(\"uuid_generate_v1()\")) @db.Uuid\n  type        Int?\n  tablename   String?   @db.VarChar(64)\n  version     Int?\n  timeupdated DateTime? @db.Timestamp(6)\n\n  @@index([version])\n}\n",
  "inlineSchemaHash": "ff8c3414ea928af94b158aa9934e3005e459d02e8a8df739ce94eb7f4613285e",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"camera_cfg\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"search_tag\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cfg_data\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id_owner\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_created\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_modified\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"camera_storage_total\":{\"dbName\":null,\"fields\":[{\"name\":\"partition_path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"camera_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"use_disk_mb\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_start\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_end\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"total_dur\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lost_dur\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":{\"name\":null,\"fields\":[\"partition_path\",\"camera_id\"]},\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"channel_cfg\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"camera_mapping_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"search_tag\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cfg_data\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id_owner\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_created\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_modified\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"device_owner_cfg\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_created\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_modified\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"event_vms_sync_parent\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lcms_server_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"event_vms_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"source_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"event_time\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"data_file_path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"partition_key\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":{\"name\":null,\"fields\":[\"id\",\"partition_key\"]},\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\\\\nThis model contains an index with non-default null sort order and requires additional setup for migrations. Visit https://pris.ly/d/default-index-null-ordering for more info.\"},\"event_vms_sync_update_parent\":{\"dbName\":null,\"fields\":[{\"name\":\"index\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"update_table_type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lcms_server_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"event_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"data_file_path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"partition_key\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":{\"name\":null,\"fields\":[\"index\",\"partition_key\"]},\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\"},\"face_index_sync_parent\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lcms_server_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"face_index_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"event_time\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"data_file_path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"partition_key\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":{\"name\":null,\"fields\":[\"id\",\"partition_key\"]},\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\\\\nThis model contains an index with non-default null sort order and requires additional setup for migrations. Visit https://pris.ly/d/default-index-null-ordering for more info.\"},\"human_info\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lcms_server_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"document_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"id_type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"release_date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"issued_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"full_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"gender\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"birthday\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"phone_number\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"email\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"address\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"note\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"company\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"list_ids\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"is_deleted\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"avatars\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"id_scan_images\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"other_images\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"root_face_images\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cropped_face_images\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"face_features\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_created\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_modified\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"height\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"weight\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"certificates_json_text\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.\"},\"human_list\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lcms_server_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"is_deleted\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_created\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_modified\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.\"},\"monitoring_slot_summary_sync_parent\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lcms_server_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"slot_summary_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"event_time\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"data_file_path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"partition_key\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":{\"name\":null,\"fields\":[\"id\",\"partition_key\"]},\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"This table is a partition table and requires additional setup for migrations. Visit https://pris.ly/d/partition-tables for more info.\\\\nThis model contains an index with non-default null sort order and requires additional setup for migrations. Visit https://pris.ly/d/default-index-null-ordering for more info.\"},\"nvr_cfg\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"search_tag\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cfg_data\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id_owner\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_created\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_modified\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"nvr_channel_cfg\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nvr_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nvr_channel_index\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"search_tag\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cfg_data\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id_owner\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_created\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_modified\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"vehicle_info\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lcms_server_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"license_plate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"manufacturer\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"color\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"color_license_plate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"images\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bytes\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"vehicle_payload\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"note\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"list_ids\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"is_deleted\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_created\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_modified\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"card_code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.\"},\"vehicle_list\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lcms_server_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"is_deleted\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_created\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"time_modified\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false,\"documentation\":\"This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.\"},\"version_control\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"uuid_generate_v1()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tablename\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"version\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timeupdated\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DVMS_DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DVMS_DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DVMS_DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

