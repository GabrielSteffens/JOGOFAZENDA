import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart'; // For kIsWeb
import 'package:path_provider/path_provider.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_static/shelf_static.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chicken Tycoon',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.brown),
        useMaterial3: true,
      ),
      home: const GamePage(),
    );
  }
}

class GamePage extends StatefulWidget {
  const GamePage({super.key});

  @override
  State<GamePage> createState() => _GamePageState();
}

class _GamePageState extends State<GamePage> {
  WebViewController? _controller;
  HttpServer? _server;
  bool _isLoading = true;
  String _status = 'Initializing...';

  @override
  void initState() {
    super.initState();
    _initServer();
  }

  @override
  void dispose() {
    _server?.close();
    super.dispose();
  }

  Future<void> _initServer() async {
    try {
      String initialUrl;

      if (kIsWeb) {
        // Web: Assets are served directly.
        // Flutter Web assets are typically at assets/<path_in_pubspec>
        // Use Uri.base to resolve to absolute URL required by loadRequest
        initialUrl = Uri.base.resolve('assets/assets/game/index.html').toString();
        setState(() => _status = 'Loading Web Assets...');
      } else {
        // Native: Use Shelf Server
        setState(() => _status = 'Preparing Assets...');
        final docsDir = await getApplicationDocumentsDirectory();
        final gameDir = Directory('${docsDir.path}/game');

        await _copyAssetsToLocal(gameDir);

        setState(() => _status = 'Starting Server...');
        final handler = createStaticHandler(
          gameDir.path,
          defaultDocument: 'index.html',
        );

        _server = await shelf_io.serve(handler, '0.0.0.0', 8080);
        initialUrl = 'http://localhost:8080/index.html';
      }

      final controller = WebViewController();
      
      if (!kIsWeb) {
        controller.setJavaScriptMode(JavaScriptMode.unrestricted);
        controller.setBackgroundColor(const Color(0x00000000));
        controller.setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (String url) {},
            onPageFinished: (String url) {},
            onWebResourceError: (WebResourceError error) {
              print('WebView Error: ${error.description}');
            },
          ),
        );
      }
      
      controller.loadRequest(Uri.parse(initialUrl));

      if (mounted) {
        setState(() {
          _controller = controller;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _status = 'Error: $e');
      print('Error initializing: $e');
    }
  }

  Future<void> _copyAssetsToLocal(Directory targetDir) async {
    // Only run on Native (Web doesn't need copy)
    if (kIsWeb) return;

    if (await targetDir.exists()) {
      await targetDir.delete(recursive: true);
    }
    await targetDir.create(recursive: true);

    // 4. Use new AssetManifest API (Flutter 3.19+)
    final manifest = await AssetManifest.loadFromAssetBundle(rootBundle);
    final gameAssets = manifest.listAssets()
        .where((string) => string.startsWith('assets/game/'))
        .toList();

    for (final assetPath in gameAssets) {
      final byteData = await rootBundle.load(assetPath);
      final list = byteData.buffer.asUint8List();

      final relativePath = assetPath.replaceFirst('assets/game/', '');
      final file = File('${targetDir.path}/$relativePath');
      await file.parent.create(recursive: true);
      await file.writeAsBytes(list);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: _isLoading
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 20),
                    Text(_status, style: const TextStyle(color: Colors.white)),
                  ],
                ),
              )
            // On Web, WebViewWidget needs to be sized or it might collapse
            : WebViewWidget(controller: _controller!),
      ),
    );
  }
}
