package com.garageapp;

import androidx.car.app.CarAppService;
import androidx.car.app.Session;
import androidx.car.app.validation.HostValidator;
import androidx.annotation.NonNull;

/**
 * Entry point Android Auto looks for when it scans installed apps for
 * car-compatible services. Registered in AndroidManifest.xml under the
 * androidx.car.app.category.IOT category -- the same category Google's
 * own documentation uses "opening a garage door" as the example for.
 */
public class GarageCarAppService extends CarAppService {

    @NonNull
    @Override
    public HostValidator createHostValidator() {
        // ALLOW_ALL_HOSTS_VALIDATOR is fine for personal sideloaded use
        // (this app was never published to Play Store). If you ever do
        // publish it, replace this with a validator restricted to
        // Google's official Android Auto host signature instead.
        return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR;
    }

    @NonNull
    @Override
    public Session onCreateSession() {
        return new GarageCarSession();
    }
}
