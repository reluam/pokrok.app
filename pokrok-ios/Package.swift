// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "Pokrok",
    platforms: [
        .iOS(.v15)
    ],
    dependencies: [
        // Clerk iOS SDK
        .package(url: "https://github.com/clerk/clerk-ios", from: "1.0.0")
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "Pokrok",
            dependencies: [
                .product(name: "Clerk", package: "clerk-ios")
            ]
        ),
    ]
)