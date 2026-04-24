<?php

namespace App\Listeners;

use App\Helpers\ActivityLogger;
use Illuminate\Auth\Events\Logout;

class LogUserLogout
{
    public function handle(Logout $event): void
    {
        if ($event->user) {
            ActivityLogger::logout($event->user);
        }
    }
}