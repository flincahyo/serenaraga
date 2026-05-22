const fs = require('fs');
let code = fs.readFileSync('src/app/admin/feed-studio/page.tsx', 'utf8');

const target = `<Upload size={18} className="text-teal-400" />
                    <p className="text-sm font-semibold text-teal-500">Upload Foto Kedua (Collage)</p>
                  </button>
                </>
              )}
            </div>`;

const replacement = `<Upload size={18} className="text-teal-400" />
                    <p className="text-sm font-semibold text-teal-500">Upload Foto Kedua (Collage)</p>
                  </button>
                </>
              )}
              {theme === 'watestimonial' && (
                <>
                  <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={onUploadWA} />
                  <button onClick={() => bgFileRef.current?.click()}
                    className="w-full border-2 border-dashed border-green-200 dark:border-green-800 rounded-2xl py-5 flex items-center justify-center gap-3 hover:border-green-400/50 hover:bg-green-900/5 transition-all group mt-3"
                  >
                    <Upload size={18} className="text-green-400" />
                    <p className="text-sm font-semibold text-green-500">Upload Screenshot WA</p>
                  </button>
                </>
              )}
            </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/app/admin/feed-studio/page.tsx', code);
  console.log('Success');
} else {
  console.log('Target not found');
}
