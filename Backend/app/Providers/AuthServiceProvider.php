<?php
// app/Providers/AuthServiceProvider.php
namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Role-based gates
        Gate::define('admin', function (User $user) {
            return $user->role->name === 'admin';
        });

        Gate::define('ketua', function (User $user) {
            return in_array($user->role->name, ['admin', 'ketua']);
        });

        Gate::define('bendahara', function (User $user) {
            return in_array($user->role->name, ['admin', 'bendahara']);
        });

        Gate::define('sekretaris', function (User $user) {
            return in_array($user->role->name, ['admin', 'sekretaris']);
        });
    }
}