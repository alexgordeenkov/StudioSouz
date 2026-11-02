# Пайплайн извлечения

Конкретные команды и приёмы. Пути утилит на машине ведущего:

- `ffmpeg` — `C:\Users\Alex\AppData\Roaming\npm\ffmpeg.exe` (определить/проверить перед запуском).
- `yt-dlp` — `python -m yt_dlp`.

## Субтитры

```powershell
python -m yt_dlp --skip-download --write-auto-subs --sub-langs "ru.*" --sub-format vtt -o "<tmp>\ep.%(ext)s" "<url>"
```

Выход: `<tmp>\ep.ru.vtt` (авто-субтитры с дублями и word-level таймингами).

## Разбор VTT

Авто-субтитры YouTube дублируют строки и дробят слова. Нужен парсер, который:
1. читает блоки `WEBVTT` (строки `HH:MM:SS.mmm --> HH:MM:SS.mmm`);
2. чистит теги `<…>` и `&nbsp;`;
3. сливает подряд идущие дубли (одинаковый текст и перекрытия) в одну строку.

Границы игр ищутся по строкам:
- «Наш … эксперимент называется <Название>» — начало игры;
- «подвести итог … побеждает» — конец.

## Сегмент видео (кадры)

```powershell
python -m yt_dlp --ffmpeg-location "<dir-ffmpeg>" -f "bv*[height<=720]/b[height<=720]" --download-sections "*HH:MM:SS-HH:MM:SS" -o "<tmp>\seg.mp4" "<url>"
```

Кадр в момент раскрытия ответа:

```powershell
ffmpeg -y -ss <t-в-сегменте> -i <tmp>\seg.mp4 -frames:v 1 -q:v 3 <tmp>\frame.jpg
```

Для карточек коллажей («Что ты такое?») в кадре 1280×720 — обрезка карточки без подписи-ответа: `crop=380:470:50:40`.

## Аудио (аудио-игры)

```powershell
python -m yt_dlp --ffmpeg-location "<dir-ffmpeg>" -f ba --download-sections "*HH:MM:22-HH:MM:SS" -o "<tmp>\clip.m4a" "<url>"
ffmpeg -y -i <tmp>\clip.m4a -vn -ac 2 -b:a 128k "public\media\audio\<slug>.mp3"
```

Имя файла — латиницей через дефис, осмысленное (`marshrutka-melody.mp3`). В раунде: `media: { localFile: '<slug>', label: '<человеческое название>' }`. MP3 не коммитятся (`.gitignore`).

## Порядок вытаскивания ответов

1. Субтитры: момент «правильный вариант/ответ» содержит верную песню/цитату — сопоставить с вариантами/цитатами.
2. Не видно → кадр (выше): агент читает, иначе пользователь.
