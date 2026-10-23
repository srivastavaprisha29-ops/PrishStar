declare namespace Cloudflare {
  interface Env {
    PRISHSTAR_HOST_MODE?: string;
    PRISHSTAR_ADMIN_PASSWORD?: string;
    PRISHSTAR_OWNER_EMAIL?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
