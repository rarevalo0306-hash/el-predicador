import XCTest
@testable import Preacher

final class ReadingLibraryTests: XCTestCase {
    @MainActor
    func testSaveReloadAndDeleteOffline() throws {
        let file = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString + ".json")
        defer { try? FileManager.default.removeItem(at: file) }
        let library = ReadingLibrary(file: file)
        XCTAssertTrue(library.save(title: "  Una lectura  ", text: "  Un pasaje para recordar.  ", source: nil))
        let restored = ReadingLibrary(file: file)
        XCTAssertEqual(restored.readings.count, 1)
        XCTAssertEqual(restored.readings[0].title, "Una lectura")
        XCTAssertEqual(restored.readings[0].text, "Un pasaje para recordar.")
        XCTAssertTrue(restored.delete(restored.readings[0]))
        XCTAssertTrue(ReadingLibrary(file: file).readings.isEmpty)
    }

    @MainActor
    func testCorruptFileIsPreserved() throws {
        let file = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString + ".json")
        defer { try? FileManager.default.removeItem(at: file) }
        let original = Data("invalid json".utf8)
        try original.write(to: file)
        let library = ReadingLibrary(file: file)
        XCTAssertNotNil(library.error)
        XCTAssertFalse(library.save(title: "New", text: "Text", source: nil))
        XCTAssertEqual(try Data(contentsOf: file), original)
    }

    @MainActor
    func testInvalidInputCanBeCorrected() {
        let file = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString + ".json")
        defer { try? FileManager.default.removeItem(at: file) }
        let library = ReadingLibrary(file: file)
        XCTAssertFalse(library.save(title: " ", text: "Text", source: nil))
        XCTAssertFalse(library.save(title: "Title", text: String(repeating: "x", count: 50_001), source: nil))
        XCTAssertTrue(library.save(title: "Title", text: "Corrected text", source: nil))
        XCTAssertNil(library.error)
    }

    @MainActor
    func testWriteFailureDoesNotChangeMemory() {
        let file = URL(fileURLWithPath: "/missing-\(UUID().uuidString)/readings.json")
        let library = ReadingLibrary(file: file)
        XCTAssertFalse(library.save(title: "Title", text: "Text", source: nil))
        XCTAssertTrue(library.readings.isEmpty)
        XCTAssertNotNil(library.error)
    }
}
