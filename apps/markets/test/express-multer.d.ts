declare global {
  namespace Express {
    namespace Multer {
      interface File {
        /** filename and metadata are not used in these tests, this is a stub */
        originalname?: string;
        mimetype?: string;
        size?: number;
        filename?: string;
      }
    }
  }
}
export {};
