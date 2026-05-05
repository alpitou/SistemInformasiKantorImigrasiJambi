<?php

return [
    'show_warnings' => false,
    'orientation' => 'portrait',
    'defines' => [
        'DOMPDF_FONT_CACHE' => storage_path('fonts/'),
        'DOMPDF_TEMP_DIR' => sys_get_temp_dir(),
        'DOMPDF_ENABLE_REMOTE' => false,
        'DOMPDF_ENABLE_JAVASCRIPT' => false,
        'DOMPDF_ENABLE_CSS_FLOAT' => true,
    ],
    'font_cache' => storage_path('fonts/'),
    'temp_dir' => sys_get_temp_dir(),
    'log_output_file' => storage_path('logs/dompdf.log'),
];