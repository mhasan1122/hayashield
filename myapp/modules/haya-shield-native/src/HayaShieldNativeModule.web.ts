import { registerWebModule, NativeModule } from 'expo';

class HayaShieldNativeModule extends NativeModule<{}> {}

export default registerWebModule(HayaShieldNativeModule, 'HayaShieldNativeModule');
