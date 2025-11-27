// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Pokrok",
    platforms: [.macOS(.v14)],
    dependencies: [
        .package(url: "https://github.com/clerk/clerk-ios", from: "0.30.0")
    ],
    targets: [
        .executableTarget(
            name: "Pokrok",
            dependencies: [
                .product(name: "Clerk", package: "clerk-ios")
            ]
        )
    ]
)

