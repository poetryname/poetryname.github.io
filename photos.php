<?php
// photos.php — отдаёт список всех фото из папки images в порядке нумерации
$dir = __DIR__ . '/images';
$files = glob($dir . '/*.{jpg,jpeg,png,gif,webp,JPG,JPEG,PNG,GIF,WEBP}', GLOB_BRACE);
$list = array();
foreach ($files as $f) {
    $list[] = 'images/' . basename($f);
}
// естественная сортировка: photo2 встанет раньше photo10
usort($list, 'strnatcasecmp');
header('Content-Type: application/json; charset=utf-8');
echo json_encode($list);
