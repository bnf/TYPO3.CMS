<?php
declare(strict_types = 1);
namespace TYPO3\CMS\Belog;

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

return function (ContainerConfigurator $configurator) {
    $configurator = $configurator->services()->defaults()
        ->private()
        ->autoconfigure()
        ->autowire();

    $configurator
        ->load(__NAMESPACE__ . '\\', '../Classes/*');

    $configurator->set(Module\BackendLogModuleBootstrap::class)
        ->public();

    $configurator->set(Controller\SystemInformationController::class)
        ->tag('signal.slot', [
            'method' => 'appendMessage',
            'signalClass' => \TYPO3\CMS\Backend\Backend\ToolbarItems\SystemInformationToolbarItem::class,
            'signalName' => 'loadMessages',
        ]);
};