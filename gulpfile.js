import gulp, { src, dest } from "gulp";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cleanCSS from "gulp-clean-css";
import terser from "gulp-terser";
import browserSync from "browser-sync";
import imagemin from "gulp-imagemin";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import svgmin from "gulp-svgmin";
import { deleteAsync } from "del";
import newer from "gulp-newer";
import sourcemaps from "gulp-sourcemaps";
import htmlmin from "gulp-htmlmin";
import imageminOptipng from "imagemin-optipng";
import imageminGifsicle from "imagemin-gifsicle";

import path from "path";
import fs from "fs";

import through2 from "through2";
import { spawn, exec as _exec } from "node:child_process";
import { promisify } from "node:util";
const execShell = promisify(_exec);

const sass = gulpSass(dartSass);
const server = browserSync.create();

const paths = {
  html: { src: "src/**/*.html", dest: "dist/" },
  styles: {
    src: "src/assets/scss/**/*.scss",
    entry: "src/assets/scss/main.scss",
    dest: "dist/assets/css",
  },
  scripts: { src: "src/assets/js/**/*.js", dest: "dist/assets/js" },
  images: {
    src: 'src/assets/images/**/*.{jpg,jpeg,png,gif}',
    dest: 'dist/assets/images'
  },
  videos: {
    src: "src/assets/videos/**/*.{mp4,webm}",
    dest: "dist/assets/videos",
  },
  svgs: { src: "src/assets/images/**/*.svg", dest: "dist/assets/images" },
};

// Limpa dist/
export const clean = () => deleteAsync(["dist"]);

// CSS (SCSS -> CSS min + sourcemap + autoprefixer)
export function styles() {
  return gulp
    .src(paths.styles.entry)
    .pipe(sourcemaps.init())
    .pipe(sass.sync({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(server.stream());
}

// JS (min + sourcemap)
export function scripts() {
  return gulp
    .src(paths.scripts.src, { sourcemaps: true })
    .pipe(terser())
    .pipe(gulp.dest(paths.scripts.dest, { sourcemaps: "." }))
    .pipe(server.stream());
}

// HTML (min)
export function html() {
  return gulp
    .src(paths.html.src)
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(paths.html.dest));
}

// Garante pasta de vídeos
export const ensureVideoDir = (done) => {
  const videoDest = paths.videos.dest;
  if (!fs.existsSync(videoDest)) {
    fs.mkdirSync(videoDest, { recursive: true });
    console.log(`📁 Pasta criada: ${videoDest}`);
  }
  done();
};

// Compressão de vídeos com ffmpeg (stream por arquivo, sem gulp-exec)
export const compressVideos = () => {
  // garante a pasta de destino
  fs.mkdirSync(paths.videos.dest, { recursive: true });

  return gulp.src(paths.videos.src, { allowEmpty: true }).pipe(
    through2.obj(function (file, _, cb) {
      if (!file || file.isDirectory()) return cb();

      const filename = path.basename(file.path);
      const output = path.resolve(paths.videos.dest, filename);

      const args = [
        "-i",
        file.path,
        "-vcodec",
        "libx264",
        "-crf",
        "18",
        "-preset",
        "slow",
        "-profile:v",
        "high",
        "-level",
        "4.2",
        "-pix_fmt",
        "yuv420p",
        "-acodec",
        "aac",
        "-b:a",
        "320k",
        "-y",
        output,
      ];

      const proc = spawn("ffmpeg", args, { stdio: "inherit" });

      proc.on("error", (err) => {
        cb(
          new Error(
            `Não foi possível iniciar o ffmpeg. Está instalado no PATH?\n${err.message}`
          )
        );
      });

      proc.on("close", (code) => {
        if (code !== 0) {
          cb(
            new Error(`ffmpeg falhou (code ${code}) no arquivo: ${file.path}`)
          );
        } else {
          cb(null, file); // segue no pipeline
        }
      });
    })
  );
};

// Imagens (otimiza + WebP)
export const images = () =>
  src(paths.images.src, { encoding: false })
    .pipe(
      imagemin([
        imageminMozjpeg({ quality: 80 }),
        imageminPngquant({ quality: [0.7, 0.9], speed: 1 }),
        imageminOptipng({ optimizationLevel: 3 }),
        imageminGifsicle({ interlaced: true }),
      ])
    )
    .pipe(dest(paths.images.dest));

// SVGs (min + cache por data)
export function svgs() {
  return gulp
    .src(paths.svgs.src)
    .pipe(newer(paths.svgs.dest))
    .pipe(svgmin())
    .pipe(gulp.dest(paths.svgs.dest));
}

// Live server
export function serve() {
  server.init({
    server: { baseDir: "dist" },
    open: false,
    notify: false,
  });

  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.html.src, gulp.series(html, reload));
  gulp.watch(
    [paths.images.src, paths.svgs.src],
    gulp.series(images, svgs, reload)
  );
  gulp.watch(
    paths.videos.src,
    gulp.series(ensureVideoDir, compressVideos, reload)
  );
}

// Reload helper
export function reload(done) {
  server.reload();
  done();
}

// Pipelines (ordem garantida p/ evitar race conditions)
export const dev = gulp.series(
  clean,
  gulp.parallel(styles, scripts, images, svgs, html),
  ensureVideoDir,
  compressVideos,
  serve
);

export const build = gulp.series(
  clean,
  gulp.parallel(styles, scripts, images, svgs, html),
  ensureVideoDir,
  compressVideos
);

// Tarefa opcional para scripts auxiliares (ex.: fetch de imagens remotas)
export const init = async () => {
  await execShell("node scripts/fetch-images.mjs");
};

export default dev;
