@component
export class SpeechToText extends BaseScriptComponent {
  private voiceMlModule: VoiceMLModule;

  onAwake() {
    print("LOADED SpeechToText");
    // Access the VoiceMLModule
    this.voiceMlModule = require("LensStudio:VoiceMLModule") as VoiceMLModule;

    const options = VoiceML.ListeningOptions.create();
    options.speechRecognizer = VoiceMLModule.SpeechRecognizer.Default;
    options.languageCode = 'en_US';

    // enable transcription but not live transcription (more accurate)
    options.shouldReturnInterimAsrTranscription = false;
    options.shouldReturnAsrTranscription = true;

    this.voiceMlModule.onListeningEnabled.add(() => {
      print("Listening enabled!");
    });

    this.voiceMlModule.onListeningDisabled.add(() => {
      print("Listening disabled, restarting...");
      // Restart listening if it gets disabled
      this.voiceMlModule.startListening(options);
    });

    this.voiceMlModule.onListeningError.add((event: VoiceML.ListeningErrorEventArgs) => {
      print(`VoiceML Error: ${event.error} - ${event.description}`);
      // Restart listening after an error
      this.voiceMlModule.startListening(options);
    });

    this.voiceMlModule.onListeningUpdate.add((event: VoiceML.ListeningUpdateEventArgs) => {
      if (event.transcription) {
        print(`Transcription: ${event.transcription}`);
        if (event.transcription.toLowerCase().includes("hey mav")) {
          print("HELLO VICTOR");
          // Continue listening after trigger phrase
          this.voiceMlModule.startListening(options);
        }
      }
    });
    
    print("Starting to listen for 'hey mav'");
    // Actually start listening right away
    this.voiceMlModule.startListening(options);
  }

  onStart() {
    // This method is called when the script starts
    print("SpeechToText component started");
  }
  
  // Add this to handle updates
  onUpdate() {
    // This keeps the component running each frame
    // You can add additional logic here if needed
  }
}