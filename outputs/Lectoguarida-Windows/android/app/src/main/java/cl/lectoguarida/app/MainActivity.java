package cl.lectoguarida.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.io.File;
import java.io.IOException;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int REQUEST_RECORD_AUDIO = 4107;
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private SpeechRecognizer speechRecognizer;
    private MediaRecorder mediaRecorder;
    private MediaPlayer mediaPlayer;
    private File recordingFile;
    private TextToSpeech textToSpeech;
    private boolean recordingActive = false;
    private boolean textToSpeechReady = false;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean keepListening = false;
    private String speechLanguage = "es-CL";
    private final StringBuilder transcriptBuffer = new StringBuilder();

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.setWebViewClient(new WebViewClientCompat() {
            @Nullable
            @Override
            public WebResourceResponse shouldInterceptRequest(@NonNull WebView view, @NonNull WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
        });

        webView.addJavascriptInterface(new SpeechBridge(), "LectoguaridaSpeech");
        initializeTextToSpeech();
        webView.loadUrl("https://appassets.androidplatform.net/assets/public/index.html");
    }

    public class SpeechBridge {
        @JavascriptInterface
        public void start(String language) {
            runOnUiThread(() -> {
                speechLanguage = language == null || language.trim().isEmpty() ? "es-CL" : language;
                transcriptBuffer.setLength(0);
                if (!SpeechRecognizer.isRecognitionAvailable(MainActivity.this)) {
                    sendSpeechEvent("error", "", "Este dispositivo no tiene reconocimiento de voz disponible.");
                    return;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                    && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQUEST_RECORD_AUDIO);
                    return;
                }
                startNativeRecording();
                keepListening = true;
                startRecognizer();
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> {
                keepListening = false;
                if (speechRecognizer != null) speechRecognizer.stopListening();
                stopNativeRecording(true);
                sendSpeechEvent("end", transcriptBuffer.toString().trim(), "");
            });
        }

        @JavascriptInterface
        public void playRecording() {
            runOnUiThread(MainActivity.this::playNativeRecording);
        }

        @JavascriptInterface
        public void speak(String text, String language) {
            runOnUiThread(() -> speakInstruction(text, language));
        }

        @JavascriptInterface
        public void stopSpeaking() {
            runOnUiThread(() -> {
                if (textToSpeech != null) textToSpeech.stop();
                sendSpeechEvent("instruction-end", "", "");
            });
        }
    }

    private void initializeTextToSpeech() {
        textToSpeech = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS) return;
            textToSpeechReady = true;
            textToSpeech.setLanguage(new Locale("es", "CL"));
            textToSpeech.setSpeechRate(0.9f);
            textToSpeech.setPitch(1.03f);
            textToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String utteranceId) { runOnUiThread(() -> sendSpeechEvent("instruction-start", "", "")); }
                @Override public void onDone(String utteranceId) { runOnUiThread(() -> sendSpeechEvent("instruction-end", "", "")); }
                @Override public void onError(String utteranceId) { runOnUiThread(() -> sendSpeechEvent("instruction-end", "", "No pude reproducir la instrucción.")); }
            });
        });
    }

    private void speakInstruction(String text, String language) {
        String clean = text == null ? "" : text.trim();
        if (clean.isEmpty()) return;
        if (!textToSpeechReady || textToSpeech == null) {
            sendSpeechEvent("instruction-error", "", "El audio de instrucciones aún se está preparando.");
            return;
        }
        if (language != null && language.toLowerCase(Locale.ROOT).startsWith("es")) {
            textToSpeech.setLanguage(new Locale("es", "CL"));
        }
        textToSpeech.speak(clean, TextToSpeech.QUEUE_FLUSH, null, "lectoguarida-instruction");
    }

    private void startNativeRecording() {
        stopNativeRecording(false);
        recordingFile = new File(getCacheDir(), "lectoguarida-ultima-lectura.m4a");
        if (recordingFile.exists()) recordingFile.delete();
        try {
            mediaRecorder = new MediaRecorder();
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.setAudioEncodingBitRate(64000);
            mediaRecorder.setAudioSamplingRate(22050);
            mediaRecorder.setOutputFile(recordingFile.getAbsolutePath());
            mediaRecorder.prepare();
            mediaRecorder.start();
            recordingActive = true;
        } catch (IOException | RuntimeException error) {
            recordingActive = false;
            releaseRecorder();
            sendSpeechEvent("recording-error", "", "No pude iniciar la grabación. Revisa el permiso del micrófono.");
        }
    }

    private void stopNativeRecording(boolean notifyReady) {
        if (recordingActive && mediaRecorder != null) {
            try { mediaRecorder.stop(); } catch (RuntimeException ignored) { }
        }
        recordingActive = false;
        releaseRecorder();
        if (notifyReady && recordingFile != null && recordingFile.exists() && recordingFile.length() > 0) {
            sendSpeechEvent("recording-ready", "", "");
        }
    }

    private void releaseRecorder() {
        if (mediaRecorder != null) {
            try { mediaRecorder.reset(); } catch (RuntimeException ignored) { }
            mediaRecorder.release();
            mediaRecorder = null;
        }
    }

    private void playNativeRecording() {
        if (recordingActive) {
            sendSpeechEvent("recording-error", "", "Primero detén la grabación para poder escucharla.");
            return;
        }
        if (recordingFile == null || !recordingFile.exists() || recordingFile.length() == 0) {
            sendSpeechEvent("recording-error", "", "Primero graba tu lectura con el micrófono.");
            return;
        }
        releasePlayer();
        mediaPlayer = new MediaPlayer();
        try {
            mediaPlayer.setDataSource(recordingFile.getAbsolutePath());
            mediaPlayer.setOnCompletionListener(player -> {
                sendSpeechEvent("recording-playback-end", "", "");
                releasePlayer();
            });
            mediaPlayer.setOnErrorListener((player, what, extra) -> {
                sendSpeechEvent("recording-error", "", "No pude reproducir la grabación.");
                releasePlayer();
                return true;
            });
            mediaPlayer.prepare();
            mediaPlayer.start();
            sendSpeechEvent("recording-playback-start", "", "");
        } catch (IOException | RuntimeException error) {
            releasePlayer();
            sendSpeechEvent("recording-error", "", "No pude reproducir la grabación.");
        }
    }

    private void releasePlayer() {
        if (mediaPlayer != null) {
            try { mediaPlayer.stop(); } catch (RuntimeException ignored) { }
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }

    private void startRecognizer() {
        destroyRecognizer();
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) { sendSpeechEvent("start", transcriptBuffer.toString().trim(), ""); }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float rmsdB) { }
            @Override public void onBufferReceived(byte[] buffer) { }
            @Override public void onEndOfSpeech() { }

            @Override
            public void onError(int error) {
                if (keepListening && (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT)) {
                    handler.postDelayed(MainActivity.this::startRecognizer, 350);
                } else {
                    keepListening = false;
                    stopNativeRecording(true);
                    sendSpeechEvent("error", transcriptBuffer.toString().trim(), readableSpeechError(error));
                }
            }

            @Override
            public void onResults(Bundle results) {
                String text = firstResult(results);
                if (!text.isEmpty()) {
                    if (transcriptBuffer.length() > 0) transcriptBuffer.append(' ');
                    transcriptBuffer.append(text);
                    sendSpeechEvent("result", transcriptBuffer.toString().trim(), "");
                }
                if (keepListening) handler.postDelayed(MainActivity.this::startRecognizer, 300);
                else sendSpeechEvent("end", transcriptBuffer.toString().trim(), "");
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                String text = firstResult(partialResults);
                String current = transcriptBuffer.length() > 0
                    ? transcriptBuffer + (text.isEmpty() ? "" : " " + text)
                    : text;
                sendSpeechEvent("partial", current.trim(), "");
            }

            @Override public void onEvent(int eventType, Bundle params) { }
        });

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, speechLanguage);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, speechLanguage);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        speechRecognizer.startListening(intent);
    }

    private String firstResult(Bundle bundle) {
        if (bundle == null) return "";
        ArrayList<String> matches = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return matches == null || matches.isEmpty() ? "" : matches.get(0);
    }

    private String readableSpeechError(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO:
                return "No pude acceder al audio. Revisa el micrófono.";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "Necesito permiso de micrófono para escuchar la lectura.";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                return "El reconocimiento de voz necesita conexión o tuvo una pausa de red.";
            case SpeechRecognizer.ERROR_CLIENT:
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return "El oído mágico está ocupado. Intenta otra vez.";
            default:
                return "No pude reconocer la lectura. Puedes intentar de nuevo o escribirla.";
        }
    }

    private void sendSpeechEvent(String type, String transcript, String message) {
        try {
            JSONObject detail = new JSONObject();
            detail.put("type", type);
            detail.put("transcript", transcript == null ? "" : transcript);
            detail.put("message", message == null ? "" : message);
            String script = String.format(
                Locale.US,
                "window.dispatchEvent(new CustomEvent('lectoguarida-native-speech',{detail:%s}));",
                detail
            );
            webView.evaluateJavascript(script, null);
        } catch (JSONException ignored) {
            webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('lectoguarida-native-speech',{detail:{type:'error',message:'Error interno de voz.'}}));", null);
        }
    }

    private void destroyRecognizer() {
        if (speechRecognizer != null) {
            speechRecognizer.destroy();
            speechRecognizer = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_RECORD_AUDIO) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startNativeRecording();
                keepListening = true;
                startRecognizer();
            } else {
                keepListening = false;
                sendSpeechEvent("error", "", "Sin permiso de micrófono puedo seguir con transcripción manual.");
            }
        }
    }

    @Override
    protected void onDestroy() {
        keepListening = false;
        destroyRecognizer();
        stopNativeRecording(false);
        releasePlayer();
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
            textToSpeech = null;
        }
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
