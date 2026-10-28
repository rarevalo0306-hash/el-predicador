import XCTest

final class PreacherUITests: XCTestCase {
    @MainActor
    func testEnglishLibrary() {
        let app = XCUIApplication()
        app.launchArguments += ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launch()
        app.navigationBars.buttons["My readings"].tap()
        XCTAssertTrue(app.buttons["Close"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.navigationBars.buttons["Add reading"].exists)
    }

    @MainActor
    func testAccessibilityLibrary() {
        let app = XCUIApplication()
        app.launchArguments += ["-AppleLanguages", "(es)", "-AppleLocale", "es_ES"]
        app.launch()
        app.navigationBars.buttons["Mis lecturas"].tap()
        XCTAssertTrue(app.buttons["Cerrar"].waitForExistence(timeout: 5))
        let addButtons = app.buttons.matching(identifier: "Añadir lectura").allElementsBoundByIndex
        XCTAssertFalse(addButtons.isEmpty)
        XCTAssertTrue(addButtons.allSatisfy { $0.isHittable })
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Biblioteca - accesibilidad y modo oscuro"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

    @MainActor
    func testSaveReadShareAndDelete() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-AppleLanguages", "(es)", "-AppleLocale", "es_ES"]
        app.launch()
        app.navigationBars.buttons["Mis lecturas"].tap()
        app.navigationBars.buttons["Añadir lectura"].tap()
        let title = "Lectura de prueba \(UUID().uuidString.prefix(6))"
        app.textFields["readingTitle"].tap()
        app.textFields["readingTitle"].typeText(title)
        app.textViews["readingText"].tap()
        app.textViews["readingText"].typeText("Una lectura guardada para comprobar el acceso sin conexion.")
        app.buttons["saveReading"].tap()
        XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 5))
        app.terminate()
        app.launch()
        app.navigationBars.buttons["Mis lecturas"].tap()
        XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 5))
        app.staticTexts[title].tap()
        XCTAssertTrue(app.staticTexts["Una lectura guardada para comprobar el acceso sin conexion."].exists)
        app.buttons["Compartir lectura"].tap()
        XCTAssertTrue(app.otherElements["ActivityListView"].waitForExistence(timeout: 5) || app.buttons["Close"].exists || app.buttons["Cerrar"].exists)
        // Relaunch dismisses the system share sheet without depending on OS language.
        app.terminate()
        app.launch()
        app.navigationBars.buttons["Mis lecturas"].tap()
        app.staticTexts[title].tap()
        app.buttons["Eliminar lectura"].tap()
        app.sheets.buttons["Eliminar lectura"].tap()
        let deleted = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.staticTexts[title])
        XCTAssertEqual(XCTWaiter.wait(for: [deleted], timeout: 10), .completed)
        app.terminate()
        app.launch()
        app.navigationBars.buttons["Mis lecturas"].tap()
        XCTAssertFalse(app.staticTexts[title].exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Mis lecturas - iPhone"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }
}
