import gulp from "gulp";
import less from "gulp-less";
import plumber from "gulp-plumber";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import sortMediaQueries from "postcss-sort-media-queries";
import cssnano from "gulp-cssnano";
import rename from "gulp-rename";

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

// Задача по умолчанию, которая будет выполняться при вызове команды gulp
export default gulp.series(style); // Вызов задачи style при запуске gulp

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
    jsVendor: "src/scripts/vendor/*.js", // Сторонние JS-файлы
  };
  
  // Задача для копирования сторонних JS-файлов
  export function jsCopy() {
    return gulp
      .src(resources.jsVendor) // Берем JS-файлы из указанной папки
      .pipe(plumber()) // Предотвращаем ошибки
      .pipe(gulp.dest(paths.scriptsDest)); // Копируем в папку назначения
  }
