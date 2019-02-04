<?php
declare(strict_types = 1);
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Extbase\Mvc\Controller\AbstractController;
use TYPO3\CMS\Extbase\Mvc\Controller\ControllerInterface;
use TYPO3\CMS\Extbase\Mvc\RequestHandlerInterface;
use TYPO3\CMS\Extbase\Object\Container\Container as ExtbaseContainer;

(function (ContainerBuilder $container) {
    $container->registerForAutoconfiguration(RequestHandlerInterface::class)->addTag('extbase.request_handler');
    $container->registerForAutoconfiguration(ControllerInterface::class)->addTag('extbase.controller');
    $container->registerForAutoconfiguration(AbstractController::class)->addTag('extbase.prototype_controller');

    $container->addCompilerPass(new class implements CompilerPassInterface {
        public function process(ContainerBuilder $container)
        {
            foreach ($container->findTaggedServiceIds('extbase.request_handler') as $id => $tags) {
                $container->findDefinition($id)->setPublic(true);
            }
            foreach ($container->findTaggedServiceIds('extbase.controller') as $id => $tags) {
                $container->findDefinition($id)->setPublic(true);
            }
            foreach ($container->findTaggedServiceIds('extbase.prototype_controller') as $id => $tags) {
                $container->findDefinition($id)->setShared(false);
            }

            // Synchronize alias definitions from symfony with alternative implementations for extbase (and vice versa)

            // Pick up legacy aliases configured in ext_localconf.php (originally for extbase) and push into the symfony container.
            // HEADS UP! This requires ext_localconf.php to be loaded during container building
            // @todo maybe we can just drop this and be breaking here as ExtbaseContainer is marked 'internal'.
            // but we sugguested registerImplementation as solution for the removed typoscript settings in (@see #86270)
            $alternativeImplementations = GeneralUtility::makeInstance(ExtbaseContainer::class)->getAlternativeImplementationsFromExtLocalconf();
            foreach ($alternativeImplementations as $className => $alternativeClassName) {
                $container->setAlias($className, $alternativeClassName)->setPublic(false);
            }

            // Push alias definition defined in symfony into the extbase container
            // 'aliasDefinitons' is a private property of the Symfony ContainerBuilder class
            // but as 'alias' statements an not be tagged, that is the only way to retrieve
            // these aliases to map them to the extbase container
            $reflection = new \ReflectionClass(get_class($container));
            $aliasDefinitions = $reflection->getProperty('aliasDefinitions');
            $aliasDefinitions->setAccessible(true);

            $extbaseContainer = $container->findDefinition(ExtbaseContainer::class);
            // Add registerImplementation() call for aliases
            foreach ($aliasDefinitions->getValue($container) as $from => $alias) {
                if (!class_exists($from) && !interface_exists($from)) {
                    continue;
                }
                $to = (string)$alias;
                // Ignore aliases that are used to inject early instances into the container (instantiated during TYPO3 Bootstrap)
                // and aliases that refer to serivce names instead of class names
                if (substr($to, 0, 7) === '_early.' || !class_exists($to)) {
                    continue;
                }

                // Do not overwrite alternative implementations from ext_localconf.php
                if (isset($alternativeImplementations[$from])) {
                    continue;
                }

                $extbaseContainer->addMethodCall('registerImplementation', [$from, $to, false]);
            }
        }
    });
})($container);

return function (ContainerConfigurator $configurator) {
    /*
    $configurator->services()->defaults()
        ->private()
        ->autoconfigure()
        ->autowire();

    $configurator
        ->load('TYPO3\\CMS\\Extbase\\', '../Classes/*')
        ->exclude('../src/{Entity,Repository,Tests}');
    */
};
