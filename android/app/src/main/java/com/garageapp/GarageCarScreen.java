package com.garageapp;

import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import androidx.car.app.CarContext;
import androidx.car.app.CarToast;
import androidx.car.app.Screen;
import androidx.car.app.model.Action;
import androidx.car.app.model.CarIcon;
import androidx.car.app.model.GridItem;
import androidx.car.app.model.GridTemplate;
import androidx.car.app.model.ItemList;
import androidx.car.app.model.Template;
import androidx.core.graphics.drawable.IconCompat;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Two-button Android Auto screen: Open / Close, matching the phone app.
 *
 * Uses plain HttpURLConnection (built into Android, zero new
 * dependencies) rather than adding OkHttp or another networking
 * library on top of the Car App Library dependency we already had to
 * add -- keeps this addition as low-risk as possible.
 */
public class GarageCarScreen extends Screen {

    // Keep these two values in sync with src/config.ts in the React
    // Native app -- this native screen runs outside the JS bridge, so
    // it can't read that file directly.
    private static final String DATABASE_URL = "https://garagecontroller-593f2-default-rtdb.firebaseio.com";
    private static final String DATABASE_SECRET = "PASTE_YOUR_DATABASE_SECRET_HERE";

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public GarageCarScreen(@NonNull CarContext carContext) {
        super(carContext);
    }

    @NonNull
    @Override
    public Template onGetTemplate() {
        GridItem openItem = new GridItem.Builder()
                .setTitle("Open")
                .setImage(new CarIcon.Builder(
                        IconCompat.createWithResource(getCarContext(), android.R.drawable.arrow_up_float))
                        .build())
                .setOnClickListener(() -> sendCommand("openGarage"))
                .build();

        GridItem closeItem = new GridItem.Builder()
                .setTitle("Close")
                .setImage(new CarIcon.Builder(
                        IconCompat.createWithResource(getCarContext(), android.R.drawable.arrow_down_float))
                        .build())
                .setOnClickListener(() -> sendCommand("closeGarage"))
                .build();

        ItemList itemList = new ItemList.Builder()
                .addItem(openItem)
                .addItem(closeItem)
                .build();

        return new GridTemplate.Builder()
                .setTitle("Garage Control")
                .setHeaderAction(Action.APP_ICON)
                .setSingleList(itemList)
                .build();
    }

    private void sendCommand(String fieldName) {
        // Network call must not run on the main thread -- do it on a
        // background thread, then hop back to the main thread only to
        // show the confirmation toast (CarToast requires main thread).
        new Thread(() -> {
            boolean success = patchFirebase(fieldName);
            mainHandler.post(() -> {
                String message = success
                        ? (fieldName.equals("openGarage") ? "Open command sent" : "Close command sent")
                        : "Command failed \u2014 check connection";
                CarToast.makeText(getCarContext(), message, CarToast.LENGTH_SHORT).show();
            });
        }).start();
    }

    private boolean patchFirebase(String fieldName) {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(DATABASE_URL + "/.json?auth=" + DATABASE_SECRET);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("PATCH");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            String json = "{\"" + fieldName + "\":true}";
            try (OutputStream os = connection.getOutputStream()) {
                os.write(json.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = connection.getResponseCode();
            return responseCode >= 200 && responseCode < 300;
        } catch (IOException e) {
            return false;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}
