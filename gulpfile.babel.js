require('@babel/register')({
    presets: ['@babel/preset-env'] // Поддержка синтаксиса ES6+.
  });
  
import gulp from "gulp";
import less from "gulp-less";
import plumber from "gulp-plumber";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import sortMediaQueries from "postcss-sort-media-queries";
import cssnano from "gulp-cssnano";
import rename from "gulp-rename";
import { series } from "gulp";
import { copy } from "./gulpfile.babel.js"; // Если в другом модуле
// Добавьте другие задачи, например, style, js и т.д.
import svgmin from "gulp-svgmin";
import svgstore from "gulp-svgstore";
import browserSync from "browser-sync";
const server = browserSync.create();

const build = gulp.series(
    clean,         // Очистка папки dist
    copy,          // Копирование статичных файлов
    includeHtml,   // Сборка HTML
    style,         // Обработка CSS (LESS)
    js,            // Обработка JavaScript
    jsCopy,        // Копирование сторонних JS
    images,        // Оптимизация изображений
    svgSprite      // Создание SVG-спрайта
  );

  // Перезагрузка сервера
function reloadServer(done) {
    server.reload();
    done();
  }
  
  // Запуск сервера и отслеживание изменений
  function serve() {
    server.init({
      server: "dist", // Указываем корневую директорию
      notify: false,  // Отключаем всплывающие уведомления
      open: false,    // Отключаем автоматическое открытие браузера
    });
  
    // Настройка отслеживания изменений
    gulp.watch(resources.html, gulp.series(includeHtml, reloadServer));
    gulp.watch(resources.less, gulp.series(style, reloadServer));
    gulp.watch(resources.jsDev, gulp.series(js, reloadServer));
    gulp.watch(resources.jsVendor, gulp.series(jsCopy, reloadServer));
    gulp.watch(resources.static, gulp.series(copy, reloadServer));
    gulp.watch(resources.images, gulp.series(images, reloadServer));
    gulp.watch(resources.svgSprite, gulp.series(svgSprite, reloadServer));
  }

// Пути к стилям
const paths = {
    scripts: "src/scripts/dev/*.js", // Исходные JS-файлы
    scriptsDest: "dist/scripts",    // Папка для готовых JS
    styles: "src/styles/styles.less", // Входной файл
    dest: "dist/styles",              // Папка для готовых стилей
};

// Задача для обработки стилей
export function style() {
  return gulp
    .src(paths.styles) // Берём исходный файл
    .pipe(plumber()) // Предотвращаем остановку при ошибке
    .pipe(less()) // Компилируем Less в CSS
    .pipe(
      postcss([
        autoprefixer({ overrideBrowserslist: ["last 4 versions"] }), // Добавляем префиксы
        sortMediaQueries({ sort: "desktop-first" }), // Сортируем медиа-запросы
      ])
    )
    .pipe(gulp.dest(paths.dest)) // Сохраняем исходный CSS
    .pipe(cssnano()) // Минифицируем CSS
    .pipe(rename("styles.min.css")) // Переименовываем
    .pipe(gulp.dest(paths.dest)); // Сохраняем минифицированный CSS
}

// Задача для обработки собственных JS-файлов
export function js() {
    return gulp
      .src(paths.scripts) // Берем исходные JS-файлы
      .pipe(plumber()) // Предотвращаем остановку при ошибках
      .pipe(
        include({
          prefix: "//@@", // Префикс для инклудов
          basepath: "@file", // Базовый путь для инклудов
        })
      )
      .pipe(gulp.dest(paths.scriptsDest)) // Сохраняем обработанные файлы
      .pipe(terser()) // Минифицируем JS
      .pipe(
        rename(function (path) {
          path.basename += ".min"; // Добавляем ".min" к имени файла
        })
      )
      .pipe(gulp.dest(paths.scriptsDest)); // Сохраняем минифицированные файлы
}
  
  // Пути для сторонних JS-файлов (например, библиотек)
  const resources = {
    static: [
        "src/assets/fonts/**/*.*", // Все шрифты
        "src/assets/images/**/*.*", // Все изображения
        "src/assets/icons/**/*.*", // Все иконки
        "src/assets/docs/**/*.*", // Документы (если есть)
    ],
    jsVendor: "src/scripts/vendor/*.js", // Сторонние JS-файлы
    svgSprite: "src/assets/svg-sprite/*.svg", // Папка с SVG-файлами
};
  
  // Задача для копирования сторонних JS-файлов
 export function jsCopy() {
    return gulp
      .src(resources.jsVendor) // Берем JS-файлы из указанной папки
      .pipe(plumber()) // Предотвращаем ошибки
      .pipe(gulp.dest(paths.scriptsDest)); // Копируем в папку назначения
}

// Задача для копирования статичных файлов
export function copy() {
    return gulp
      .src(resources.static, {
        base: "src", // Сохраняем структуру исходных папок
      })
      .pipe(gulp.dest("dist/")); // Копируем файлы в папку dist
}

export default gulp.series(copy, svgSprite, style, js, jsCopy);

// Задача для создания SVG-спрайта
export function svgSprite() {
    return gulp
      .src(resources.svgSprite) // Берем все SVG из указанной папки
      .pipe(
        svgmin({
          js2svg: {
            pretty: true, // Форматируем код для читаемости
          },
        })
      )
      .pipe(
        svgstore({
          inlineSvg: true, // Генерация символьного спрайта
        })
      )
      .pipe(rename("symbols.svg")) // Переименовываем итоговый файл
      .pipe(gulp.dest("dist/assets/icons")); // Сохраняем в папку dist
  }

  const start = gulp.series(build, serve);

  export {
    clean,
    copy,
    includeHtml,
    style,
    js,
    jsCopy,
    images,
    svgSprite,
    build,
    serve,
    start,
  };
  