import ExpoModulesCore

#if canImport(AlarmKit)
import AlarmKit
import CryptoKit
import SwiftUI

@available(iOS 26.0, *)
private struct FajryAlarmMetadata: AlarmMetadata {}
#endif

public class IosAlarmKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("IosAlarmKit")

    AsyncFunction("isAvailable") { () -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) { return true }
      #endif
      return false
    }

    AsyncFunction("requestAuthorization") { () -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        return try await Self.requestAuthorization()
      }
      #endif
      return "unavailable"
    }

    AsyncFunction("scheduleAlarm") { (id: String, fireAtMs: Double, title: String) in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        try await Self.scheduleAlarm(id: id, fireAtMs: fireAtMs, title: title)
        return
      }
      #endif
      throw NSError(
        domain: "IosAlarmKit",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "AlarmKit requires iOS 26"]
      )
    }

    AsyncFunction("cancelAlarm") { (id: String) in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        try Self.cancelAlarm(id: id)
        return
      }
      #endif
    }

    AsyncFunction("cancelAllAlarms") { () in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        try Self.cancelAllAlarms()
        return
      }
      #endif
    }
  }

  #if canImport(AlarmKit)
  @available(iOS 26.0, *)
  private static func requestAuthorization() async throws -> String {
    let manager = AlarmManager.shared
    switch manager.authorizationState {
    case .authorized:
      return "authorized"
    case .denied:
      return "denied"
    case .notDetermined:
      let status = try await manager.requestAuthorization()
      switch status {
      case .authorized: return "authorized"
      case .denied: return "denied"
      case .notDetermined: return "notDetermined"
      @unknown default: return "notDetermined"
      }
    @unknown default:
      return "notDetermined"
    }
  }

  @available(iOS 26.0, *)
  private static func scheduleAlarm(id: String, fireAtMs: Double, title: String) async throws {
    let fireAt = Date(timeIntervalSince1970: fireAtMs / 1000)
    let stopButton = AlarmButton(
      text: LocalizedStringResource(stringLiteral: "Stop"),
      textColor: .white,
      systemImageName: "stop.circle"
    )
    let alert = AlarmPresentation.Alert(
      title: LocalizedStringResource(stringLiteral: title),
      stopButton: stopButton
    )
    let attributes = AlarmAttributes(
      presentation: AlarmPresentation(alert: alert),
      metadata: FajryAlarmMetadata(),
      tintColor: Color(red: 226 / 255, green: 184 / 255, blue: 66 / 255)
    )
    let configuration = AlarmManager.AlarmConfiguration.alarm(
      schedule: .fixed(fireAt),
      attributes: attributes,
      sound: .default
    )
    try await AlarmManager.shared.schedule(id: uuid(from: id), configuration: configuration)
  }

  @available(iOS 26.0, *)
  private static func cancelAlarm(id: String) throws {
    try AlarmManager.shared.cancel(id: uuid(from: id))
  }

  @available(iOS 26.0, *)
  private static func cancelAllAlarms() throws {
    let alarms = try AlarmManager.shared.alarms
    for alarm in alarms {
      try AlarmManager.shared.cancel(id: alarm.id)
    }
  }

  private static func uuid(from id: String) -> UUID {
    var bytes = Array(Insecure.MD5.hash(data: Data("fajry.alarm.\(id)".utf8)))
    bytes[6] = (bytes[6] & 0x0F) | 0x30
    bytes[8] = (bytes[8] & 0x3F) | 0x80
    return UUID(uuid: (
      bytes[0], bytes[1], bytes[2], bytes[3],
      bytes[4], bytes[5], bytes[6], bytes[7],
      bytes[8], bytes[9], bytes[10], bytes[11],
      bytes[12], bytes[13], bytes[14], bytes[15]
    ))
  }
  #endif
}
