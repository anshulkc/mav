@component
export class Startup_Sequence extends BaseScriptComponent {
 // api.activated: boolean = false;

  private gestureModule: GestureModule = require('LensStudio:GestureModule');
  private tapTimestamps: number[] = [];
  public activated: boolean = false;

  onAwake() {
    print("LOADED STARTUP_SEQUENCE");
    this.createEvent("OnStartEvent").bind(() => this.onStart());
  }

  private recordTap() {
    const currentTime = getTime(); // Current time in seconds
    this.tapTimestamps.push(currentTime);

    // Remove taps older than 3 seconds
    this.tapTimestamps = this.tapTimestamps.filter(timestamp => currentTime - timestamp <= 3);

    // Check for 4 taps within 3 seconds
    if (this.tapTimestamps.length >= 4 && !this.activated) {
      this.activated = true;
      print("Gesture sequence detected. Activated!");
      print("HI THERE VICTOR")
    }
  }

  onStart() {
    this.gestureModule
      .getPalmTapUpEvent(GestureModule.HandType.Right)
      .add((palmTapUpArgs: PalmTapUpArgs) => {
        print('tap up');
        this.recordTap();
      });

    this.gestureModule
      .getPalmTapDownEvent(GestureModule.HandType.Right)
      .add((palmTapDownArgs: PalmTapDownArgs) => {
        print('tap down');
        this.recordTap();
      });
  }
}