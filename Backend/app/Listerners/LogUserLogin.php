<?php

namespace App\Listeners;

use App\Helpers\ActivityLogger;
use Illuminate\Auth\Events\Login;

class LogUserLogin
{
    public function handle(Login $event): void
    {
        ActivityLogger::login($event->user);
    }
}