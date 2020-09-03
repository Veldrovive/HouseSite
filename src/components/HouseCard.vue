<template>
    <b-card class="houseCard"
        no-body
    >
        <b-card-img id="cardImg" :src='houseImg'/>

        <b-card-body id="cardTitleContainer">
            <b-card-title>{{ house.name }}</b-card-title>
        </b-card-body>
        
        <b-list-group flush id='houseMembers'>
            <b-list-group-item v-for='user in house.users' :key='user._id' class="d-flex justify-content-between align-items-center"><p>{{ user.firstName }}</p><p>{{ owedInfo[user._id] ? `${owedInfo[user._id] > 0 ? '-' : '+'}$${Math.abs(owedInfo[user._id]).toFixed(2)}` : '$0.00' }}</p></b-list-group-item>
        </b-list-group>

        <div id='growerNotShower'></div>

        <template v-slot:footer>
            <b-button variant="secondary" @click=navigateToHouse>View</b-button>
            <b-button variant="outline-secondary">Shopping</b-button>
        </template>
    </b-card>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
    name: "HouseCard",
    props: ['index'],
    computed: {
        ...mapState('house', ['myHouses']),
        ...mapGetters('house', ['myHousesOwedInfo']),
        house: {
            get: function() {
                return this.myHouses[this.index];
            }
        },
        owedInfo() {
            return this.myHousesOwedInfo[this.house._id];
        },
        houseImg() {
            return this.house.imgPath;
        }
    },
    methods: {
        navigateToHouse() {
            this.$router.push(`/house/${this.house._id}`);
        }
    }
}
</script>

<style scoped lang='less'>
.houseCard {
    // margin: 0 auto;
    margin: 0 0;
    min-height: 0;
    width: 20vw;
    flex-shrink: 0;
    p {
        margin: 0;
    }

    #cardImg {
        height: 10vw;
        object-fit: cover;
    }

    #cardTitleContainer {
        padding-bottom: 10px;
        flex: 0 0 auto;
    }

    #houseMembers {
        overflow-y: scroll;
        // flex: 1 0 auto;
    }

    #growerNotShower {
        flex: 1 0 auto;
    }

    button {
        margin-right: 10px;
    }
}
</style>