"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationStatus = void 0;
// ประเภทของสถานะการทำงานของระบบ Automation
var AutomationStatus;
(function (AutomationStatus) {
    AutomationStatus["IDLE"] = "idle";
    AutomationStatus["WAITING_OTP"] = "waiting_otp";
    AutomationStatus["PROCESSING"] = "processing";
    AutomationStatus["SUCCESS"] = "success";
    AutomationStatus["ERROR"] = "error";
})(AutomationStatus = exports.AutomationStatus || (exports.AutomationStatus = {}));
