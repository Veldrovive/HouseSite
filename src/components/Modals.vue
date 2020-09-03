<template>
    <div>
        <CreateHouseModal></CreateHouseModal>
        <CreateUserModal></CreateUserModal>
        <SetHouseImgModal></SetHouseImgModal>
    </div>
</template>

<script>
import CreateHouseModal from './modals/CreateHouseModal';
import CreateUserModal from './modals/CreateUserModal';
import SetHouseImgModal from './modals/SetHouseImgModal';

export default {
    name: "modals",
    components: {
        CreateHouseModal,
        CreateUserModal,
        SetHouseImgModal
    }
}
</script>

<style lang="less" scoped>

</style>